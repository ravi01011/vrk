const tls = require('tls');

const host = 'ac-rkxadw2-shard-00-00.tfoubc8.mongodb.net';
const port = 27017;

const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
    console.log('connected, authorized=', socket.authorized);
    console.log('protocol=', socket.getProtocol());
    const cert = socket.getPeerCertificate(true);
    console.log('peer cert subject:', cert.subject);
    console.log('peer cert issuer:', cert.issuer);
    console.log('valid from:', cert.valid_from, 'valid to:', cert.valid_to);
    console.log('cipher:', socket.getCipher());
    socket.end();
});

socket.on('error', (err) => {
    console.error('TLS socket error:', err && err.stack ? err.stack : err);
});
