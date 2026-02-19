const crypto = require('crypto');

const stringToSign = "folder=techvoice/documents&public_id=doc-1771488758579-ArqPoint_Project__Setup__Image_Update_Instructions&timestamp=1771488758";
const secret = "GgxKOtbfQHVIpqj6ckSZKBVOOAk";

const hash = crypto.createHash('sha1').update(stringToSign + secret).digest('hex');
console.log('calculated signature:', hash);
