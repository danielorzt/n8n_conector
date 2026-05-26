-- =============================================
-- NovaSync — Seed Data (from Google Sheet "Inventario")
-- Run AFTER schema.sql
-- =============================================

insert into products (codigo, nombre, categoria, precio, stock_actual, stock_minimo, proveedor, score_ia, icono) values
  -- Monitores
  ('MON-027', 'Monitor Dell UltraSharp 27"',      'Monitores',      850000,   3,  8,  'ImportTech Bogota',   9, 'Monitor'),
  ('MON-024', 'Monitor LG 24"',                   'Monitores',      620000,  15,  6,  'ImportTech Bogota',   7, 'Monitor'),
  ('MON-032', 'Monitor Samsung 32" 4K',            'Monitores',     1200000,   5,  5,  'Samsung Colombia',    8, 'Monitor'),
  -- Laptops
  ('LAP-001', 'Laptop Lenovo ThinkPad X1',         'Laptops',       3200000,  12,  5,  'TechCol Bogota',      9, 'Laptop'),
  ('LAP-002', 'Laptop HP EliteBook',               'Laptops',       2800000,   8,  4,  'HP Colombia',         8, 'Laptop'),
  ('LAP-003', 'Laptop Dell Latitude',              'Laptops',       3500000,   2,  5,  'Dell Colombia',       8, 'Laptop'),
  ('LAP-004', 'Laptop Apple MacBook Air',          'Laptops',       4500000,   6,  3,  'Apple Colombia',      9, 'Laptop'),
  -- Impresoras
  ('IMP-001', 'Impresora HP LaserJet Pro',         'Impresoras',     620000,   2,  4,  'OfficeMax Colombia',  8, 'Printer'),
  ('IMP-002', 'Impresora Epson EcoTank',           'Impresoras',     450000,  10,  5,  'Epson Colombia',      7, 'Printer'),
  ('IMP-003', 'Impresora Canon PIXMA',             'Impresoras',     380000,   7,  4,  'Canon Colombia',      7, 'Printer'),
  -- Periféricos
  ('TEC-003', 'Teclado Logitech MX Keys',          'Perifericos',    280000,  25, 10,  'Logi Distribuidores', 8, 'Keyboard'),
  ('TEC-004', 'Teclado Mecánico Redragon',         'Perifericos',    180000,  18,  8,  'Gamers Colombia',     7, 'Keyboard'),
  ('MOU-001', 'Mouse Logitech MX Master',          'Perifericos',    220000,  20,  8,  'Logi Distribuidores', 8, 'Package'),
  ('MOU-002', 'Mouse Inalámbrico HP',              'Perifericos',     85000,  30, 12,  'HP Colombia',         6, 'Package'),
  -- Cámaras
  ('CAM-005', 'Camara Logitech Brio 4K',           'Camaras',        450000,   7,  6,  'TechCol Bogota',      9, 'Camera'),
  ('CAM-006', 'Camara Logitech HD 1080p',          'Camaras',        220000,  14,  6,  'TechCol Bogota',      7, 'Camera'),
  -- Audio
  ('AUR-002', 'Audifonos Sony WH-1000XM5',         'Audio',          980000,   4,  5,  'Sony Colombia',       9, 'Headphones'),
  ('AUR-003', 'Audifonos JBL Tune 760',            'Audio',          320000,  12,  6,  'JBL Colombia',        7, 'Headphones'),
  ('AUR-004', 'Audifonos Apple AirPods Pro',       'Audio',         1200000,   6,  4,  'Apple Colombia',      9, 'Headphones'),
  -- Tablets
  ('TAB-001', 'Tablet Samsung Galaxy Tab',         'Tablets',       1500000,   8,  4,  'Samsung Colombia',    8, 'Package'),
  ('TAB-002', 'iPad Apple 10ma Gen',               'Tablets',       2200000,   3,  4,  'Apple Colombia',      9, 'Package'),
  -- Almacenamiento
  ('DIS-001', 'Disco Duro Externo 1TB WD',         'Almacenamiento', 180000,  22,  8,  'WD Colombia',         7, 'Package'),
  ('DIS-002', 'SSD Samsung 500GB',                 'Almacenamiento', 250000,  16,  7,  'Samsung Colombia',    8, 'Package'),
  -- Accesorios
  ('USB-001', 'Hub USB-C 7 en 1',                 'Accesorios',      95000,  35, 15,  'TechCol Bogota',      7, 'Package'),
  ('CAR-001', 'Cargador Inalámbrico 15W',          'Accesorios',      75000,  28, 12,  'TechCol Bogota',      6, 'Package'),
  -- Proyectores
  ('PRO-001', 'Proyector Epson 3600 Lumens',       'Proyectores',   2800000,   4,  3,  'Epson Colombia',      8, 'Package'),
  -- Redes
  ('SWI-001', 'Switch TP-Link 8 puertos',          'Redes',          95000,   9,  4,  'TP-Link Colombia',    7, 'Package'),
  ('ROU-001', 'Router WiFi 6 Asus',                'Redes',          380000,   5,  4,  'Asus Colombia',       8, 'Package'),
  -- Energía
  ('UPS-001', 'UPS APC 750VA',                     'Energia',        420000,   6,  3,  'APC Colombia',        7, 'Package'),
  -- Software
  ('SOF-001', 'Office 365 Licencia Anual',         'Software',       350000,  50, 20,  'Microsoft Colombia',  8, 'Package')
on conflict (codigo) do nothing;
