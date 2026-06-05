import { Request, Response, NextFunction } from 'express';

/**
 * Mock file upload middleware simulating Multer's file parsing behavior.
 * In a production S3 deployment, this would write to S3 and attach the S3 URI.
 * Here, it extracts base64 or file URL from request body/headers and binds it to `req.file`.
 */
export const uploadSingleImage = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(`[EOC Upload] Parsing file upload parameter for field: ${fieldName}`);
    
    // Simulate S3 file upload: if req.body has an image (either base64 or URL), we simulate uploading it to S3
    if (req.body && req.body[fieldName]) {
      const uploadPayload = req.body[fieldName];
      
      let s3Url = 'https://panic-sense-s3-bucket.s3.amazonaws.com/uploads/default-incident.jpg';
      if (uploadPayload.startsWith('data:image')) {
        // Base64 image uploaded
        const fileExtension = uploadPayload.substring("data:image/".length, uploadPayload.indexOf(";base64")) || 'png';
        s3Url = `https://panic-sense-s3-bucket.s3.amazonaws.com/uploads/incident_${Date.now()}.${fileExtension}`;
      } else if (typeof uploadPayload === 'string') {
        s3Url = uploadPayload; // It's already a URL
      }

      // Attach mock file object to express request (just like Multer does)
      (req as any).file = {
        fieldname: fieldName,
        originalname: `incident_report_upload.${s3Url.split('.').pop()}`,
        mimetype: 'image/jpeg',
        size: 1024 * 142, // mock size
        location: s3Url // S3 file URL location property
      };
    } else {
      // Fallback default image link if none is uploaded
      (req as any).file = {
        fieldname: fieldName,
        originalname: 'default-incident.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 12,
        location: 'https://panic-sense-s3-bucket.s3.amazonaws.com/uploads/default-incident.jpg'
      };
    }

    next();
  };
};
