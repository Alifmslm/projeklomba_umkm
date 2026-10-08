# Spec Delta

## Purpose

Membantu UMKM menilai potensi kolaborasi sebelum booking dengan estimasi jangkauan audiens per kreator dan estimasi ROI per paket, lengkap dengan asumsi yang transparan.

## ADDED Requirements

### Requirement: Jangkauan potensial kreator

Sistem SHALL menampilkan estimasi jangkauan potensial (perkiraan jumlah audiens yang tersentuh per video) untuk setiap kreator, yang dihitung dari jumlah followers dan engagement rate kreator tersebut.

#### Scenario: Kreator memiliki followers dan engagement rate

- **WHEN** pengguna melihat halaman detail kreator yang memiliki followers dan engagement rate
- **THEN** sistem menampilkan angka jangkauan potensial dalam format yang mudah dibaca (misal "≈ 9,8 rb tersentuh/video")

#### Scenario: Kartu kreator di halaman daftar

- **WHEN** pengguna melihat kartu kreator pada daftar kreator
- **THEN** kartu menampilkan ringkasan jangkauan potensial yang konsisten dengan halaman detail kreator tersebut

### Requirement: Estimasi ROI per paket

Sistem SHALL menampilkan estimasi ROI (perkiraan rasio potensi balik modal) untuk setiap paket di halaman detail kreator, yang dihitung dari jangkauan potensial kreator, asumsi tingkat konversi, asumsi nilai transaksi, dan harga paket.

#### Scenario: Paket dengan harga diketahui

- **WHEN** pengguna melihat daftar paket pada halaman detail kreator
- **THEN** setiap paket menampilkan estimasi ROI yang dihitung berdasarkan jangkauan potensial kreator dan harga paket tersebut

#### Scenario: Estimasi ROI dengan biaya lebih tinggi dari potensi pendapatan

- **WHEN** hasil perhitungan estimasi ROI lebih kecil dari 1
- **THEN** sistem menampilkan estimasi ROI tersebut sebagai indikasi bahwa balik modal diprediksi di bawah anggaran paket

### Requirement: Transparansi asumsi estimasi

Sistem SHALL menampilkan catatan pada halaman yang memuat estimasi bahwa seluruh angka jangkauan dan ROI adalah perkiraan berdasarkan asumsi (engagement rate, tingkat konversi, dan nilai transaksi rata-rata), bukan jaminan hasil nyata.

#### Scenario: Pengguna membuka halaman yang menampilkan estimasi

- **WHEN** halaman detail kreator menampilkan jangkauan potensial atau estimasi ROI
- **THEN** halaman tersebut menyertakan catatan asumsi yang menjelaskan dasar perhitungan dan bahwa hasil aktual dapat berbeda

### Requirement: Nilai engagement rate per kreator

Sistem SHALL menyimpan dan menggunakan nilai engagement rate setiap kreator dalam perhitungan jangkauan potensial.

#### Scenario: Kreator tidak memiliki nilai engagement rate

- **WHEN** perhitungan dilakukan untuk kreator yang engagement rate-nya kosong atau tidak tersedia
- **THEN** sistem menggunakan nilai default yang wajar dan tetap menampilkan estimasi tanpa error