const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with custom namespace path
const io = socketIo(server, {
  path: '/educational-bandongklang/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Port configuration: Defaults to 80, fallbacks handled dynamically
const PORT = process.env.PORT || 80;
const DB_FILE = path.join(__dirname, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redirect root URL to namespace path for ease of access
app.get('/', (req, res) => {
  res.redirect('/educational-bandongklang');
});

// Serve static frontend files under /educational-bandongklang
app.use('/educational-bandongklang', express.static(path.join(__dirname, 'public')));
// Serve uploaded files under /educational-bandongklang/uploads (Local fallback)
app.use('/educational-bandongklang/uploads', express.static(UPLOADS_DIR));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Helper functions to read/write local DB
function readLocalDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return { users: [], media: [], subjects: [], levels: [], types: [] };
  }
}

function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// ==========================================================================
// SUPABASE CLOUD DATABASE & STORAGE SETTINGS (Option 1)
// ==========================================================================
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Helper to seed/reset default admin user in Supabase
async function seedAdminUser() {
  if (!supabase) return;
  try {
    console.log('[Supabase Seed] Upserting default admin user...');
    const { error } = await supabase
      .from('users')
      .upsert({
        username: 'admin',
        password: 'admin', // default admin password
        fullName: 'ผู้ดูแลระบบหลังบ้าน',
        role: 'admin',
        status: 'approved'
      }, { onConflict: 'username' });

    if (error) {
      console.error('[Supabase Seed] Error upserting admin user:', error.message);
    } else {
      console.log('[Supabase Seed] Admin user synced successfully! (User: admin / Pass: admin)');
    }
  } catch (err) {
    console.error('[Supabase Seed] Unexpected error seeding admin user:', err);
  }
}

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Supabase] Initialized cloud client successfully!');
    // Seeding admin user on startup
    seedAdminUser();
  } catch (e) {
    console.error('[Supabase] Failed to initialize client:', e);
  }
} else {
  console.log('[Database] Using local JSON database file.');
}

// Helper to upload file to Supabase Storage
async function uploadFileToSupabase(file) {
  if (!supabase) return null;
  
  const fileContent = fs.readFileSync(file.path);
  const fileName = `${file.fieldname}-${Date.now()}-${file.originalname}`;
  
  const { data, error } = await supabase.storage
    .from('media-bucket')
    .upload(fileName, fileContent, {
      contentType: file.mimetype,
      upsert: false
    });
    
  if (error) {
    console.error('[Supabase Storage] Upload error:', error);
    throw error;
  }
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('media-bucket')
    .getPublicUrl(fileName);
    
  // Delete local temp file
  try {
    fs.unlinkSync(file.path);
  } catch (e) {
    console.error('[Multer] Temp file cleanup error:', e);
  }
  
  return publicUrlData.publicUrl;
}

// Helper to delete file from Supabase Storage
async function deleteFileFromSupabase(fileUrl) {
  if (!supabase || !fileUrl) return;
  // Extract filename from public URL (e.g. .../media-bucket/filename.ext)
  const urlParts = fileUrl.split('/media-bucket/');
  if (urlParts.length > 1) {
    const filename = urlParts[1];
    const { error } = await supabase.storage
      .from('media-bucket')
      .remove([filename]);
    if (error) {
      console.error('[Supabase Storage] File delete error:', error);
    }
  }
}

// Router namespace
const router = express.Router();

// ==========================================================================
// AUTHENTICATION & TEACHERS APIS
// ==========================================================================

// 1. User Registration (Teachers)
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
    }

    const uLower = username.toLowerCase().trim();
    
    if (supabase) {
      // Supabase Mode
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', uLower)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        return res.status(409).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานในระบบแล้ว' });
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: uLower,
          password: password.trim(),
          fullName: fullName.trim(),
          role: 'teacher',
          status: 'pending'
        });

      if (insertError) throw insertError;
    } else {
      // Local JSON Mode
      const db = readLocalDB();
      const userExists = db.users.some(u => u.username.toLowerCase() === uLower);
      if (userExists) {
        return res.status(409).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานในระบบแล้ว' });
      }

      db.users.push({
        username: uLower,
        password: password.trim(),
        fullName: fullName.trim(),
        role: 'teacher',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      writeLocalDB(db);
    }

    // Notify admins via websocket
    io.emit('teacher-registration', { username: uLower, fullName: fullName.trim() });
    res.status(201).json({ success: true, message: 'ลงทะเบียนสำเร็จ อยู่ระหว่างรอแอดมินอนุมัติสิทธิ์การอัปโหลด' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// 2. User Login (Admin & Teachers)
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const uLower = username.toLowerCase().trim();
    let user = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', uLower)
        .maybeSingle();
      if (error) throw error;
      user = data;
    } else {
      const db = readLocalDB();
      user = db.users.find(u => u.username.toLowerCase() === uLower);
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์จากแอดมิน' });
    }

    res.json({
      success: true,
      token: 'mock-token-' + user.username + '-' + Date.now(),
      username: user.username,
      fullName: user.fullName,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการล็อกอิน' });
  }
});

// 3. Admin: Get all teacher accounts
router.get('/api/admin/teachers', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } else {
      const db = readLocalDB();
      res.json(db.users.filter(u => u.role === 'teacher'));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคุณครูได้' });
  }
});

// 4. Admin: Approve teacher
router.put('/api/admin/teachers/:username/approve', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('username', username);
      if (error) throw error;
      
      const { data: dbUsers } = await supabase.from('users').select('*');
      const { data: dbMedia } = await supabase.from('media').select('*');
      const localDB = readLocalDB();
      
      io.emit('teacher-updated', {
        action: 'approve',
        username: username,
        db: { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types }
      });
    } else {
      const db = readLocalDB();
      const index = db.users.findIndex(u => u.username.toLowerCase() === username);
      if (index === -1) return res.status(404).json({ error: 'ไม่พบผู้ใช้ในระบบ' });
      
      db.users[index].status = 'approved';
      writeLocalDB(db);
      io.emit('teacher-updated', { action: 'approve', username: username, db: db });
    }

    res.json({ success: true, message: 'อนุมัติสิทธิ์คุณครูเสร็จเรียบร้อย' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอนุมัติคุณครู' });
  }
});

// 5. Admin: Reject/Delete teacher
router.delete('/api/admin/teachers/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    if (supabase) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('username', username);
      if (error) throw error;

      const { data: dbUsers } = await supabase.from('users').select('*');
      const { data: dbMedia } = await supabase.from('media').select('*');
      const localDB = readLocalDB();

      io.emit('teacher-updated', {
        action: 'delete',
        username: username,
        db: { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types }
      });
    } else {
      const db = readLocalDB();
      db.users = db.users.filter(u => u.username.toLowerCase() !== username);
      writeLocalDB(db);
      io.emit('teacher-updated', { action: 'delete', username: username, db: db });
    }

    res.json({ success: true, message: 'ลบบัญชีผู้ใช้เสร็จเรียบร้อย' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้' });
  }
});

// ==========================================================================
// MEDIA CURRICULUM APIS
// ==========================================================================

// 1. Get all database configurations & media
router.get('/api/media', async (req, res) => {
  try {
    const localDB = readLocalDB();
    if (supabase) {
      const { data: dbMedia, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('createdAt', { ascending: false });
      if (mediaError) throw mediaError;

      res.json({
        media: dbMedia || [],
        subjects: localDB.subjects,
        levels: localDB.levels,
        types: localDB.types
      });
    } else {
      res.json(localDB);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดสื่อการสอน' });
  }
});

// 2. Add new media item
router.post('/api/media', upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, subject, level, type, author, sourceType, fileUrl, creatorUsername } = req.body;
    let finalFileUrl = fileUrl || '';
    let originalName = '';
    let finalCoverUrl = '';

    // Handle Uploaded Media File
    if (sourceType === 'upload' && req.files['mediaFile']) {
      const mediaFile = req.files['mediaFile'][0];
      if (supabase) {
        // Upload to Supabase Storage
        finalFileUrl = await uploadFileToSupabase(mediaFile);
      } else {
        // Local File Path
        finalFileUrl = `/educational-bandongklang/uploads/${mediaFile.filename}`;
      }
      originalName = mediaFile.originalname;
    }

    // Handle Uploaded Cover Image
    if (req.files['coverImage']) {
      const coverImage = req.files['coverImage'][0];
      if (supabase) {
        finalCoverUrl = await uploadFileToSupabase(coverImage);
      } else {
        finalCoverUrl = `/educational-bandongklang/uploads/${coverImage.filename}`;
      }
    }

    const newMedia = {
      id: 'm_' + Date.now(),
      title: title || 'สื่อการสอนไม่มีชื่อ',
      description: description || '',
      subject: subject || 'วิทยาศาสตร์และเทคโนโลยี',
      level: level || 'ประถมศึกษาปีที่ 1',
      type: type || 'E-Book',
      author: author || 'ไม่ระบุผู้สร้าง',
      sourceType: sourceType || 'link',
      fileUrl: finalFileUrl,
      fileName: originalName,
      coverUrl: finalCoverUrl,
      creatorUsername: creatorUsername || 'admin',
      views: 0,
      downloads: 0,
      createdAt: new Date().toISOString()
    };

    let updatedDB;
    if (supabase) {
      const { error } = await supabase.from('media').insert(newMedia);
      if (error) throw error;

      const { data: dbMedia } = await supabase.from('media').select('*');
      const { data: dbUsers } = await supabase.from('users').select('*');
      const localDB = readLocalDB();
      updatedDB = { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types };
    } else {
      const db = readLocalDB();
      db.media.unshift(newMedia);
      writeLocalDB(db);
      updatedDB = db;
    }

    // Broadcast socket update
    io.emit('media-updated', { action: 'create', data: newMedia, db: updatedDB });
    res.status(201).json(newMedia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกสื่อการสอน: ' + (err.message || err) });
  }
});

// 3. Update existing media
router.put('/api/media/:id', upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const mediaId = req.params.id;
    let currentMedia = null;

    if (supabase) {
      const { data, error } = await supabase.from('media').select('*').eq('id', mediaId).maybeSingle();
      if (error) throw error;
      currentMedia = data;
    } else {
      const db = readLocalDB();
      currentMedia = db.media.find(item => item.id === mediaId);
    }

    if (!currentMedia) {
      return res.status(404).json({ error: 'ไม่พบสื่อการสอนที่ระบุ' });
    }

    const { title, description, subject, level, type, author, sourceType, fileUrl } = req.body;
    let finalFileUrl = currentMedia.fileUrl;
    let originalName = currentMedia.fileName;
    let finalCoverUrl = currentMedia.coverUrl;

    // Handle Uploaded Media File
    if (sourceType === 'upload') {
      if (req.files['mediaFile']) {
        const mediaFile = req.files['mediaFile'][0];
        // Delete old file if present
        if (supabase) {
          await deleteFileFromSupabase(currentMedia.fileUrl);
          finalFileUrl = await uploadFileToSupabase(mediaFile);
        } else {
          // Delete old local file
          if (currentMedia.fileUrl.startsWith('/educational-bandongklang/uploads/')) {
            const oldPath = path.join(UPLOADS_DIR, currentMedia.fileUrl.substring('/educational-bandongklang/uploads/'.length));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          finalFileUrl = `/educational-bandongklang/uploads/${mediaFile.filename}`;
        }
        originalName = mediaFile.originalname;
      }
    } else {
      // If switched to link, delete old file
      if (currentMedia.sourceType === 'upload') {
        if (supabase) {
          await deleteFileFromSupabase(currentMedia.fileUrl);
        } else if (currentMedia.fileUrl.startsWith('/educational-bandongklang/uploads/')) {
          const oldPath = path.join(UPLOADS_DIR, currentMedia.fileUrl.substring('/educational-bandongklang/uploads/'.length));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }
      finalFileUrl = fileUrl || '';
      originalName = '';
    }

    // Handle Uploaded Cover Image
    if (req.files['coverImage']) {
      const coverImage = req.files['coverImage'][0];
      if (supabase) {
        await deleteFileFromSupabase(currentMedia.coverUrl);
        finalCoverUrl = await uploadFileToSupabase(coverImage);
      } else {
        if (currentMedia.coverUrl && currentMedia.coverUrl.startsWith('/educational-bandongklang/uploads/')) {
          const oldCover = path.join(UPLOADS_DIR, currentMedia.coverUrl.substring('/educational-bandongklang/uploads/'.length));
          if (fs.existsSync(oldCover)) fs.unlinkSync(oldCover);
        }
        finalCoverUrl = `/educational-bandongklang/uploads/${coverImage.filename}`;
      }
    }

    const updatedMedia = {
      ...currentMedia,
      title: title || currentMedia.title,
      description: description !== undefined ? description : currentMedia.description,
      subject: subject || currentMedia.subject,
      level: level || currentMedia.level,
      type: type || currentMedia.type,
      author: author || currentMedia.author,
      sourceType: sourceType || currentMedia.sourceType,
      fileUrl: finalFileUrl,
      fileName: originalName,
      coverUrl: finalCoverUrl
    };

    let updatedDB;
    if (supabase) {
      const { error } = await supabase.from('media').update(updatedMedia).eq('id', mediaId);
      if (error) throw error;

      const { data: dbMedia } = await supabase.from('media').select('*');
      const { data: dbUsers } = await supabase.from('users').select('*');
      const localDB = readLocalDB();
      updatedDB = { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types };
    } else {
      const db = readLocalDB();
      const idx = db.media.findIndex(item => item.id === mediaId);
      db.media[idx] = updatedMedia;
      writeLocalDB(db);
      updatedDB = db;
    }

    // Broadcast socket update
    io.emit('media-updated', { action: 'update', data: updatedMedia, db: updatedDB });
    res.json(updatedMedia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขสื่อการสอน' });
  }
});

// 4. Delete media item
router.delete('/api/media/:id', async (req, res) => {
  try {
    const mediaId = req.params.id;
    let mediaItem = null;

    if (supabase) {
      const { data, error } = await supabase.from('media').select('*').eq('id', mediaId).maybeSingle();
      if (error) throw error;
      mediaItem = data;
    } else {
      const db = readLocalDB();
      mediaItem = db.media.find(item => item.id === mediaId);
    }

    if (!mediaItem) {
      return res.status(404).json({ error: 'ไม่พบสื่อการสอนที่ต้องการลบ' });
    }

    // Delete associated files
    if (supabase) {
      if (mediaItem.sourceType === 'upload') await deleteFileFromSupabase(mediaItem.fileUrl);
      if (mediaItem.coverUrl) await deleteFileFromSupabase(mediaItem.coverUrl);

      const { error: delError } = await supabase.from('media').delete().eq('id', mediaId);
      if (delError) throw delError;

      const { data: dbMedia } = await supabase.from('media').select('*');
      const { data: dbUsers } = await supabase.from('users').select('*');
      const localDB = readLocalDB();
      io.emit('media-updated', { action: 'delete', id: mediaId, db: { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types } });
    } else {
      // Local delete
      if (mediaItem.sourceType === 'upload' && mediaItem.fileUrl.startsWith('/educational-bandongklang/uploads/')) {
        const filename = mediaItem.fileUrl.substring('/educational-bandongklang/uploads/'.length);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      if (mediaItem.coverUrl && mediaItem.coverUrl.startsWith('/educational-bandongklang/uploads/')) {
        const filename = mediaItem.coverUrl.substring('/educational-bandongklang/uploads/'.length);
        const coverPath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }

      const db = readLocalDB();
      db.media = db.media.filter(item => item.id !== mediaId);
      writeLocalDB(db);
      io.emit('media-updated', { action: 'delete', id: mediaId, db: db });
    }

    res.json({ success: true, message: 'ลบสื่อการสอนเสร็จเรียบร้อย' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบสื่อการสอน' });
  }
});

// 5. Track media views
router.post('/api/media/:id/view', async (req, res) => {
  try {
    const mediaId = req.params.id;
    let newViews = 0;
    
    if (supabase) {
      const { data: media } = await supabase.from('media').select('views').eq('id', mediaId).maybeSingle();
      if (media) {
        newViews = (media.views || 0) + 1;
        await supabase.from('media').update({ views: newViews }).eq('id', mediaId);
        
        const { data: dbMedia } = await supabase.from('media').select('*');
        const { data: dbUsers } = await supabase.from('users').select('*');
        const localDB = readLocalDB();
        io.emit('media-updated', { action: 'stats', id: mediaId, db: { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types } });
      }
    } else {
      const db = readLocalDB();
      const media = db.media.find(item => item.id === mediaId);
      if (media) {
        media.views = (media.views || 0) + 1;
        newViews = media.views;
        writeLocalDB(db);
        io.emit('media-updated', { action: 'stats', id: mediaId, db: db });
      }
    }
    
    res.json({ success: true, views: newViews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// 6. Track media downloads
router.post('/api/media/:id/download', async (req, res) => {
  try {
    const mediaId = req.params.id;
    let newDownloads = 0;

    if (supabase) {
      const { data: media } = await supabase.from('media').select('downloads').eq('id', mediaId).maybeSingle();
      if (media) {
        newDownloads = (media.downloads || 0) + 1;
        await supabase.from('media').update({ downloads: newDownloads }).eq('id', mediaId);

        const { data: dbMedia } = await supabase.from('media').select('*');
        const { data: dbUsers } = await supabase.from('users').select('*');
        const localDB = readLocalDB();
        io.emit('media-updated', { action: 'stats', id: mediaId, db: { users: dbUsers, media: dbMedia, subjects: localDB.subjects, levels: localDB.levels, types: localDB.types } });
      }
    } else {
      const db = readLocalDB();
      const media = db.media.find(item => item.id === mediaId);
      if (media) {
        media.downloads = (media.downloads || 0) + 1;
        newDownloads = media.downloads;
        writeLocalDB(db);
        io.emit('media-updated', { action: 'stats', id: mediaId, db: db });
      }
    }

    res.json({ success: true, downloads: newDownloads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Apply router to /educational-bandongklang path
app.use('/educational-bandongklang', router);

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Dynamically start server with port fallback helper
const startServer = (port) => {
  server.listen(port, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`  Minimalist Media Hub Server running successfully!`);
    console.log(`  Local Address:  http://localhost${port === 80 ? '' : ':' + port}/educational-bandongklang`);
    
    // Print network IP address for other devices on LAN
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`  Network IP:     http://${net.address}${port === 80 ? '' : ':' + port}/educational-bandongklang`);
        }
      }
    }
    console.log(`==================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      if (port === 80) {
        console.log(`[Server] Port 80 is occupied or requires admin privileges. Trying port 8080...`);
        startServer(8080);
      } else {
        console.error(`[Server] Port ${port} is also occupied. Exiting.`);
        process.exit(1);
      }
    } else {
      console.error('[Server] Unexpected error starting server:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);
