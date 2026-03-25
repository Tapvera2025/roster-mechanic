const emailService = require('./src/services/email.service');

console.log('\n=== Email Service Status ===');
console.log('Enabled:', emailService.isEnabled);
console.log('From:', emailService.from);
console.log('Has transporter:', !!emailService.transporter);

emailService.verifyConnection()
  .then(result => {
    console.log('Connection test:', result ? 'SUCCESS ✅' : 'FAILED ❌');

    if (result) {
      console.log('\n✅ Email service is working correctly!');
      console.log('📧 Emails will be sent when you create employees.');
    } else {
      console.log('\n❌ Email service connection failed.');
    }

    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
