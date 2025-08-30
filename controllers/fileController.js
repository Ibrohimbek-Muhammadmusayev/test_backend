const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// @desc    Upload files
// @route   POST /api/admin/upload
// @access  Private (Admin only)
const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000000);
      const fileExtension = path.extname(file.originalname);
      const fileName = `upload-${timestamp}-${randomNum}${fileExtension}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      // Process image if it's an image file
      if (file.mimetype.startsWith('image/')) {
        await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .webp({ quality: 85 })
          .toFile(filePath.replace(fileExtension, '.webp'));
        
        uploadedFiles.push({
          originalName: file.originalname,
          fileName: fileName.replace(fileExtension, '.webp'),
          filePath: `/uploads/${fileName.replace(fileExtension, '.webp')}`,
          size: file.size,
          mimetype: 'image/webp'
        });
      } else {
        // Save non-image files as is
        fs.writeFileSync(filePath, file.buffer);
        
        uploadedFiles.push({
          originalName: file.originalname,
          fileName: fileName,
          filePath: `/uploads/${fileName}`,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500);
      throw new Error(`Failed to upload file: ${file.originalname}`);
    }
  }

  res.json({
    success: true,
    message: `${uploadedFiles.length} files uploaded successfully`,
    files: uploadedFiles
  });
});

// @desc    Delete file
// @route   DELETE /api/admin/files
// @access  Private (Admin only)
const deleteFile = asyncHandler(async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    res.status(400);
    throw new Error('File path is required');
  }

  // Security check - ensure file is in uploads directory
  if (!filePath.startsWith('/uploads/')) {
    res.status(400);
    throw new Error('Invalid file path');
  }

  const fullPath = path.join(__dirname, '..', filePath);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404);
      throw new Error('File not found');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500);
    throw new Error('Failed to delete file');
  }
});

// @desc    Get file info
// @route   GET /api/admin/files/info
// @access  Private (Admin only)
const getFileInfo = asyncHandler(async (req, res) => {
  const { filePath } = req.query;

  if (!filePath) {
    res.status(400);
    throw new Error('File path is required');
  }

  // Security check
  if (!filePath.startsWith('/uploads/')) {
    res.status(400);
    throw new Error('Invalid file path');
  }

  const fullPath = path.join(__dirname, '..', filePath);

  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const fileExtension = path.extname(filePath);
      
      res.json({
        success: true,
        fileInfo: {
          path: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          extension: fileExtension,
          isImage: ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension.toLowerCase()),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      });
    } else {
      res.status(404);
      throw new Error('File not found');
    }
  } catch (error) {
    console.error('File info error:', error);
    res.status(500);
    throw new Error('Failed to get file info');
  }
});

// @desc    List files in uploads directory
// @route   GET /api/admin/files
// @access  Private (Admin only)
const listFiles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'all' } = req.query;
  const uploadsPath = path.join(__dirname, '../uploads');

  try {
    if (!fs.existsSync(uploadsPath)) {
      return res.json({
        success: true,
        files: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalFiles: 0
        }
      });
    }

    // Get all files recursively
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          const relativePath = path.relative(path.join(__dirname, '..'), filePath);
          const fileExtension = path.extname(file).toLowerCase();
          const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension);
          
          // Filter by type
          if (type === 'images' && !isImage) return;
          if (type === 'documents' && isImage) return;
          
          fileList.push({
            name: file,
            path: `/${relativePath.replace(/\\/g, '/')}`,
            size: stat.size,
            sizeFormatted: formatFileSize(stat.size),
            extension: fileExtension,
            isImage,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime
          });
        }
      });
      
      return fileList;
    };

    const allFiles = getAllFiles(uploadsPath);
    
    // Sort by creation date (newest first)
    allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = allFiles.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      files: paginatedFiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allFiles.length / limit),
        totalFiles: allFiles.length,
        hasNext: endIndex < allFiles.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500);
    throw new Error('Failed to list files');
  }
});

// @desc    Clean unused files
// @route   DELETE /api/admin/files/cleanup
// @access  Private (Admin only)
const cleanupUnusedFiles = asyncHandler(async (req, res) => {
  const { dryRun = true } = req.query;
  
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    const { User, Product, Category, Banner } = require('../models');
    
    // Get all file references from database
    const usedFiles = new Set();
    
    // Get user profile images
    const users = await User.findAll({ attributes: ['profileImage'] });
    users.forEach(user => {
      if (user.profileImage) usedFiles.add(user.profileImage);
    });
    
    // Get product images
    const products = await Product.findAll({ attributes: ['images'] });
    products.forEach(product => {
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(img => usedFiles.add(img));
      }
    });
    
    // Get category images
    const categories = await Category.findAll({ attributes: ['image'] });
    categories.forEach(category => {
      if (category.image) usedFiles.add(category.image);
    });
    
    // Get banner images
    const banners = await Banner.findAll({ attributes: ['image'] });
    banners.forEach(banner => {
      if (banner.image) usedFiles.add(banner.image);
    });
    
    // Get all files in uploads directory
    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          const relativePath = path.relative(path.join(__dirname, '..'), filePath);
          fileList.push({
            fullPath: filePath,
            relativePath: `/${relativePath.replace(/\\/g, '/')}`,
            size: stat.size
          });
        }
      });
      
      return fileList;
    };
    
    const allFiles = getAllFiles(uploadsPath);
    const unusedFiles = allFiles.filter(file => !usedFiles.has(file.relativePath));
    
    let deletedCount = 0;
    let totalSizeFreed = 0;
    
    if (dryRun === 'false') {
      // Actually delete files
      unusedFiles.forEach(file => {
        try {
          fs.unlinkSync(file.fullPath);
          deletedCount++;
          totalSizeFreed += file.size;
        } catch (error) {
          console.error(`Failed to delete ${file.relativePath}:`, error);
        }
      });
    }
    
    res.json({
      success: true,
      message: dryRun === 'false' ? 
        `Cleanup completed. ${deletedCount} files deleted.` : 
        `Dry run completed. ${unusedFiles.length} unused files found.`,
      unusedFiles: unusedFiles.map(f => ({
        path: f.relativePath,
        size: f.size,
        sizeFormatted: formatFileSize(f.size)
      })),
      stats: {
        totalFiles: allFiles.length,
        usedFiles: usedFiles.size,
        unusedFiles: unusedFiles.length,
        deletedFiles: deletedCount,
        totalSizeFreed: formatFileSize(totalSizeFreed)
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500);
    throw new Error('Failed to cleanup files');
  }
});

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  uploadFiles,
  deleteFile,
  getFileInfo,
  listFiles,
  cleanupUnusedFiles
};