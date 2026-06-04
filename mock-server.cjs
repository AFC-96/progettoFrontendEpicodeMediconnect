// mock-server.js — Custom JSON Server with middleware for MediConnect API
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Helper: wrap response in the format the frontend expects
const wrap = (res, data, statusCode = 200, message = 'Success') => {
    res.json({ statusCode, message, data });
};

// ─── AUTH ────────────────────────────────────────────────────────────
server.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = router.db;
    const user = db.get('users').find({ email, password }).value();
    if (user) {
        const roles = user.roles.map(r => r.name);
        wrap(res, { token: 'mock-jwt-token-' + user.id, roles });
    } else {
        res.status(401).json({ statusCode: 401, message: 'Invalid email or password', data: null });
    }
});

server.post('/api/auth/register', (req, res) => {
    const { name, email, password, roles: reqRoles } = req.body;
    const db = router.db;
    const existing = db.get('users').find({ email }).value();
    if (existing) {
        return res.status(400).json({ statusCode: 400, message: 'Email already registered', data: null });
    }
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        profilePictureUrl: null,
        roles: (reqRoles || ['PATIENT']).map(r => ({ name: r }))
    };
    db.get('users').push(newUser).write();

    // Create profile based on role
    const roles = reqRoles || ['PATIENT'];
    if (roles.includes('DOCTOR')) {
        const { licenseNumber, specialization } = req.body;
        db.get('doctors').push({
            id: Date.now(),
            userId: newUser.id,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            specialization: specialization || 'GENERAL_PRACTICE',
            licenseNumber: licenseNumber || '',
            user: { id: newUser.id, email, name }
        }).write();
    }
    if (roles.includes('PATIENT')) {
        db.get('patients').push({
            id: Date.now() + 1,
            userId: newUser.id,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            phone: '',
            dateOfBirth: '',
            knownAllergies: '',
            bloodGroup: '',
            genotype: '',
            user: { id: newUser.id, email, name }
        }).write();
    }

    wrap(res, { message: 'Registration successful' });
});

server.post('/api/auth/forgot-password', (_req, res) => {
    wrap(res, { message: 'Reset code sent to your email' });
});

server.post('/api/auth/reset-password', (_req, res) => {
    wrap(res, { message: 'Password reset successfully' });
});

// ─── USERS ───────────────────────────────────────────────────────────
server.get('/api/users/me', (req, res) => {
    const db = router.db;
    // In a real app we'd decode the token; here we extract user ID from mock token
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    const user = db.get('users').find({ id: userId }).value();
    if (user) {
        const { password, ...safeUser } = user;
        void password; // suppress unused warning
        wrap(res, safeUser);
    } else {
        res.status(404).json({ statusCode: 404, message: 'User not found', data: null });
    }
});

server.get('/api/users/all', (_req, res) => {
    const db = router.db;
    const users = db.get('users').value().map(({ password, ...u }) => { void password; return u; });
    wrap(res, users);
});

server.get('/api/users/by-id/:userId', (req, res) => {
    const db = router.db;
    const user = db.get('users').find({ id: parseInt(req.params.userId) }).value();
    if (user) {
        const { password, ...safeUser } = user;
        void password;
        wrap(res, safeUser);
    } else {
        res.status(404).json({ statusCode: 404, message: 'User not found', data: null });
    }
});

server.put('/api/users/update-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const db = router.db;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    const user = db.get('users').find({ id: userId }).value();

    if (!user) {
        return res.status(404).json({ statusCode: 404, message: 'User not found', data: null });
    }
    if (user.password !== oldPassword) {
        return res.status(400).json({ statusCode: 400, message: 'Current password is incorrect', data: null });
    }
    if (!newPassword || newPassword.length < 5) {
        return res.status(400).json({ statusCode: 400, message: 'New password must be at least 5 characters', data: null });
    }

    db.get('users').find({ id: userId }).assign({ password: newPassword }).write();
    wrap(res, { message: 'Password updated successfully' });
});

server.put('/api/users/profile-picture', (_req, res) => {
    wrap(res, { message: 'Profile picture updated' });
});

// ─── PATIENTS ────────────────────────────────────────────────────────
server.get('/api/patients/me', (req, res) => {
    const db = router.db;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    let patient = db.get('patients').find({ userId }).value();
    if (!patient) {
        // Auto-create empty patient profile
        const user = db.get('users').find({ id: userId }).value();
        const nameParts = (user?.name || '').split(' ');
        patient = {
            id: Date.now(),
            userId,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: '', dateOfBirth: '', knownAllergies: '',
            bloodGroup: '', genotype: '',
            user: { id: userId, email: user?.email || '', name: user?.name || '' }
        };
        db.get('patients').push(patient).write();
    }
    wrap(res, patient);
});

server.put('/api/patients/me', (req, res) => {
    const db = router.db;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    let patient = db.get('patients').find({ userId });
    if (patient.value()) {
        patient.assign(req.body).write();
        wrap(res, patient.value());
    } else {
        // Auto-create patient profile with the submitted data
        const newPatient = { id: Date.now(), userId, ...req.body, user: { id: userId } };
        db.get('patients').push(newPatient).write();
        wrap(res, newPatient);
    }
});

server.get('/api/patients/genotype', (_req, res) => {
    wrap(res, router.db.get('genotypes').value());
});

server.get('/api/patients/bloodgroup', (_req, res) => {
    wrap(res, router.db.get('bloodgroups').value());
});

server.get('/api/patients/:patientId', (req, res) => {
    const db = router.db;
    const patient = db.get('patients').find({ id: parseInt(req.params.patientId) }).value();
    if (patient) wrap(res, patient);
    else res.status(404).json({ statusCode: 404, message: 'Patient not found', data: null });
});

// ─── DOCTORS ─────────────────────────────────────────────────────────
server.get('/api/doctors/me', (req, res) => {
    const db = router.db;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    const doctor = db.get('doctors').find({ userId }).value();
    if (doctor) wrap(res, doctor);
    else res.status(404).json({ statusCode: 404, message: 'Doctor profile not found', data: null });
});

server.put('/api/doctors/me', (req, res) => {
    const db = router.db;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const userId = parseInt(token.replace('mock-jwt-token-', '')) || 1;
    const doctor = db.get('doctors').find({ userId });
    if (doctor.value()) {
        doctor.assign(req.body).write();
        wrap(res, doctor.value());
    } else {
        res.status(404).json({ statusCode: 404, message: 'Doctor not found', data: null });
    }
});

server.get('/api/doctors', (_req, res) => {
    wrap(res, router.db.get('doctors').value());
});

server.get('/api/doctors/specializations', (_req, res) => {
    wrap(res, router.db.get('specializations').value());
});

server.get('/api/doctors/:doctorId', (req, res) => {
    const doctor = router.db.get('doctors').find({ id: parseInt(req.params.doctorId) }).value();
    if (doctor) wrap(res, doctor);
    else res.status(404).json({ statusCode: 404, message: 'Doctor not found', data: null });
});

// ─── APPOINTMENTS ────────────────────────────────────────────────────
server.get('/api/appointments', (_req, res) => {
    wrap(res, router.db.get('appointments').value());
});

server.post('/api/appointments', (req, res) => {
    const db = router.db;
    const doctor = db.get('doctors').find({ id: req.body.doctorId }).value();
    const patient = db.get('patients').first().value(); // simplified: use first patient
    const newAppt = {
        id: Date.now(),
        ...req.body,
        status: 'SCHEDULED',
        meetingLink: 'https://meet.example.com/' + Date.now(),
        doctor: doctor ? { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName, specialization: doctor.specialization } : {},
        patient: patient ? {
            id: patient.id, firstName: patient.firstName, lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth, bloodGroup: patient.bloodGroup,
            genotype: patient.genotype, knownAllergies: patient.knownAllergies,
            user: { email: patient.user?.email }
        } : {}
    };
    db.get('appointments').push(newAppt).write();
    wrap(res, newAppt);
});

server.put('/api/appointments/cancel/:id', (req, res) => {
    const db = router.db;
    const appt = db.get('appointments').find({ id: parseInt(req.params.id) });
    if (appt.value()) {
        appt.assign({ status: 'CANCELLED' }).write();
        wrap(res, appt.value());
    } else {
        res.status(404).json({ statusCode: 404, message: 'Appointment not found', data: null });
    }
});

server.put('/api/appointments/complete/:id', (req, res) => {
    const db = router.db;
    const appt = db.get('appointments').find({ id: parseInt(req.params.id) });
    if (appt.value()) {
        appt.assign({ status: 'COMPLETED' }).write();
        wrap(res, appt.value());
    } else {
        res.status(404).json({ statusCode: 404, message: 'Appointment not found', data: null });
    }
});

// ─── CONSULTATIONS ───────────────────────────────────────────────────
server.get('/api/consultations/appointment/:appointmentId', (req, res) => {
    const c = router.db.get('consultations').find({ appointmentId: parseInt(req.params.appointmentId) }).value();
    if (c) wrap(res, c);
    else res.status(404).json({ statusCode: 404, message: 'Consultation not found', data: null });
});

server.get('/api/consultations/history', (req, res) => {
    const patientId = req.query.patientId ? parseInt(req.query.patientId) : null;
    let consultations = router.db.get('consultations').value();
    if (patientId) {
        consultations = consultations.filter(c => c.patientId === patientId);
    }
    wrap(res, consultations);
});

server.post('/api/consultations', (req, res) => {
    const db = router.db;
    const newConsultation = {
        id: Date.now(),
        ...req.body,
        patientId: 1,
        consultationDate: new Date().toISOString()
    };
    db.get('consultations').push(newConsultation).write();
    wrap(res, newConsultation);
});

// ─── START ───────────────────────────────────────────────────────────
const PORT = 8086;
server.listen(PORT, () => {
    console.log(`\n  🏥 MediConnect Mock API running on http://localhost:${PORT}`);
    // Dynamically display test credentials based on current users in the mock DB
    const db = router.db;
    const patientUser = db.get('users')
      .filter(u => u.roles.some(r => r.name === 'PATIENT'))
      .head()
      .value();
    const doctorUser = db.get('users')
      .filter(u => u.roles.some(r => r.name === 'DOCTOR'))
      .head()
      .value();
    console.log(`\n  Test credentials:`);
    if (patientUser) console.log(`    Patient: ${patientUser.email} / ${patientUser.password}`);
    if (doctorUser) console.log(`    Doctor:  ${doctorUser.email}  / ${doctorUser.password}`);
    console.log();
    console.log(`\n  📌 How to register users in the mock server:`);
    console.log(`    • Patient: POST /api/auth/register with JSON body { "name": "John Doe", "email": "john@example.com", "password": "pwd123", "roles": ["PATIENT"] }`);
    console.log(`    • Doctor:  POST /api/auth/register with JSON body { "name": "Dr. Jane", "email": "jane@example.com", "password": "pwd123", "roles": ["DOCTOR"], "specialization": "CARDIOLOGY", "licenseNumber": "MED-12345" }`);
    console.log(`\n  You can use curl, Postman, or any HTTP client to hit these endpoints.`);


    console.log(`    • Doctor:  POST /api/auth/register with JSON body { "name": "Dr. Jane", "email": "jane@example.com", "password": "pwd123", "roles": ["DOCTOR"], "specialization": "CARDIOLOGY", "licenseNumber": "MED-12345" }`);
    console.log(`\n  You can use curl, Postman, or any HTTP client to hit these endpoints.`);
});
