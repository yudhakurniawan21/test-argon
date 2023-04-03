const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { expressjwt: eJwt } = require("express-jwt");

const secretKey = 'mysecretkey';

function createToken(user) {
    const token = jwt.sign({ id: user.id, email: user.email }, secretKey);
    return token;
}

const authenticateJwt = eJwt({ secret: secretKey, algorithms: ['HS256'] });

const app = express();
const upload = multer({ dest: 'uploads/' });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'argon'
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('MySQL connected');
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/register', upload.single('photo'), (req, res) => {
    console.log(req);
    const name = req.body.name.toString();
    const email = req.body.email.toString();
    const password = req.body.password.toString();
    const job = req.body.job.toString();
    const phone = req.body.phone.toString();

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            const photo_path = req.file.path;

            db.query('INSERT INTO users (name, email, password, photo_path, job, phone) VALUES (?, ?, ?, ?, ?, ?)', [name, email, hash, photo_path, job, phone], (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal server error');
                } else {
                    res.status(200).send('User registered successfully');
                }
            });
        }
    });
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else if (results.length == 0) {
            res.status(404).send('User not found');
        } else {
            bcrypt.compare(password, results[0].password, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal server error');
                } else if (result === false) {
                    res.status(401).send('Invalid password');
                } else {
                    const user = {
                        id: results[0].id,
                        name: results[0].name,
                        email: results[0].email,
                        photo_path: results[0].photo_path,
                        job: results[0].job,
                        phone: results[0].phone,
                        role: results[0].role,
                    };

                    const token = createToken(user);
                    res.status(200).send({ user, token });
                }
            });
        }
    });
});

app.post('/profile/update/:id', authenticateJwt, upload.single('photo'), (req, res) => {
    const id = req.params.id;
    // const name = req.body.name;
    // const email = req.body.email;
    const password = req.body.password;
    // const job = req.body.job;
    const phone = req.body.phone;
    let photo_path = '';

    if (req.file) {
        photo_path = req.file.path;
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            db.query('UPDATE users SET password = ?, photo_path = ?, phone = ? WHERE id = ?', [hash, photo_path, phone, id], (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal server error');
                } else if (result.affectedRows == 0) {
                    res.status(404).send('User not found');
                } else {
                    res.status(200).send('User updated successfully');
                }

            });
        }
    });
});

app.post('/user/update/:id', authenticateJwt, upload.single('photo'), (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const job = req.body.job;
    const phone = req.body.phone;
    let photo_path = '';

    if (req.file) {
        photo_path = req.file.path;
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            db.query('UPDATE users SET name = ?, email = ?, password = ?, job = ?, photo_path = ?, phone = ? WHERE id = ?', [name, email, hash, job, photo_path, phone, id], (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal server error');
                } else if (result.affectedRows == 0) {
                    res.status(404).send('User not found');
                } else {
                    res.status(200).send('User updated successfully');
                }

            });
        }
    });
});

app.get('/users', authenticateJwt, (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            const resData = results.map((result) => ({
                id: result.id,
                name: result.name,
                email: result.email,
                job: result.job,
                phone: result.phone
            }))
            res.status(200).send(resData);
        }
    });
});

// Endpoint untuk mengambil data karyawan berdasarkan id
app.get('/users/:id', authenticateJwt, (req, res) => {
    const id = req.params.id;
    const sql = `SELECT * FROM users WHERE id=?`;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal server error');
        } else {
            const resData = results.map((result) => ({
                id: result.id,
                name: result.name,
                email: result.email,
                job: result.job,
                phone: result.phone
            }))
            res.status(200).send(resData);
        }
    });
});

// Endpoint untuk menambahkan data kehadiran karyawan
app.post('/api/kehadiran', authenticateJwt, (req, res) => {
    const { users_id, tanggal, jam, status } = req.body;
    const sql = `INSERT INTO attendance (users_id, tanggal, jam, status)
                 VALUES (?, ?, ?, ?)`;
    db.query(sql, [users_id, tanggal, jam, status], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Terjadi kesalahan saat menambahkan data kehadiran.');
        } else {
            res.status(200).send('Data kehadiran berhasil ditambahkan.');
        }
    });
});

// Endpoint untuk mengambil data kehadiran karyawan
app.get('/api/kehadiran', authenticateJwt, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sqlCount = `SELECT COUNT(*) as total FROM attendance`;
    const sqlData = `SELECT * FROM attendance LIMIT ? OFFSET ?`;

    db.query(sqlCount, (errCount, resultCount) => {
        if (errCount) {
            console.error(errCount);
            res.status(500).send('Terjadi kesalahan saat mengambil data kehadiran.');
        } else {
            const totalData = resultCount[0].total;
            const totalPages = Math.ceil(totalData / limit);

            db.query(sqlData, [limit, offset], (errData, resultData) => {
                if (errData) {
                    console.error(errData);
                    res.status(500).send('Terjadi kesalahan saat mengambil data kehadiran.');
                } else {
                    const data = resultData;
                    const response = {
                        data,
                        pagination: {
                            page,
                            limit,
                            totalData,
                            totalPages
                        }
                    };
                    res.status(200).json(response);
                }
            });
        }
    });
});


// Endpoint untuk mengambil data kehadiran karyawan
app.get('/api/kehadiran/:id', authenticateJwt, (req, res) => {
    const users_id = req.params.id;
    const { startDate, endDate } = req.query;
    const sql = `SELECT * FROM attendance WHERE users_id=? AND tanggal BETWEEN ? AND ?`;
    db.query(sql, [users_id, startDate, endDate], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Terjadi kesalahan saat mengambil data kehadiran.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Endpoint untuk mengubah data kehadiran karyawan
app.put('/api/kehadiran/:id', authenticateJwt, (req, res) => {
    const id = req.params.id;
    const { users_id, tanggal, jam, status } = req.body;
    const sql = `UPDATE attendance SET users_id=?, tanggal=?, jam=?, status=? WHERE id=?`;
    db.query(sql, [users_id, tanggal, jam, status, id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Terjadi kesalahan saat mengubah data kehadiran.');
        } else {
            res.status(200).send('Data kehadiran berhasil diubah.');
        }
    });
});

// Endpoint untuk menghapus data kehadiran karyawan
app.delete('/api/kehadiran/:id', authenticateJwt, (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM attendance WHERE id=?`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Terjadi kesalahan saat menghapus data kehadiran.');
        } else {
            res.status(200).send('Data kehadiran berhasil dihapus.');
        }
    });
});

// Endpoint untuk mengambil data kehadiran dalam satu bulan sampai dengan hari ini
app.get('/api/kehadiran/bulanan/:id', authenticateJwt, (req, res) => {
    const users_id = req.params.id;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const sql = 'SELECT * FROM attendance WHERE users_id=? AND tanggal BETWEEN ? AND ?';
    db.query(sql, [users_id, firstDayOfMonth, lastDayOfMonth], (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

// Endpoint untuk mengambil data kehadiran dengan filter range tanggal
app.get('/api/kehadiran/filter', authenticateJwt, (req, res) => {
    const { startDate, endDate } = req.query;
    const sql = 'SELECT * FROM attendance WHERE tanggal BETWEEN ? AND ?';
    db.query(sql, [startDate, endDate], (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

app.listen(4000, () => {
    console.log('Server started on port 4000');
});
