## Informasi terkait teknis Aplikasi

dalam project ini terdapat 3 aplikasi yaitu : 
- Frontend Aplikasi Absensi
- Frontend Aplikasi Admin
- Backend Rest API

untuk frontend sendiri source code berada di dalam folder *frontend* sedangkan untuk source code backend sendiri berada didalam folder *backend*, 
untuk dapat menjalankan backend silahkan masuk kedalam folder backend dan jalan kan perintah `npm start` dari terminal maka server rest api akan berjalan pada http://localhost:4000, sedangkan untuk menjalankan frontend silahkan masuk kedalaam folder frontend dan jalankan perintah `npm run dev` maka aplikasi Absensi atau Aplikasi Admin akan berjalan pada http://localhost:3000

## Mengakses Aplikasi
untuk menjalankan Aplikasi Admin dapat melakukan login dengan email: admin@argon.com dan password: 123456, sedangkan untuk menjalankan Aplikasi Absensi dapat melakukan login dengan email: testing@argon.com dan password: 123456,

## Database
didalam project ini sudah disertakan dump sql dengan file bernama *argon.sql* untuk dapat dilakukan import terlebih dahulu kedalam database anda agar dapat mengakses keseluruhan aplikasi backend secara menyeluruh. kemudian sesuaikan config yang berada didalam file server.js yang berada didalam folder backend dengan konfigurasi database anda.