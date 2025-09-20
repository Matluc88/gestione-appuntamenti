
INSERT INTO services (name, slug, requires_upload, requires_notes, has_options, service_options) VALUES
('Emissione Fatture', 'emissione-fatture', TRUE, TRUE, FALSE, '[]'),
('730', '730', FALSE, TRUE, FALSE, '[]'),
('ISEE', 'isee', FALSE, TRUE, FALSE, '[]'),
('IMU', 'imu', FALSE, TRUE, FALSE, '[]'),
('TARI', 'tari', FALSE, TRUE, FALSE, '[]'),
('Bonus Sociali', 'bonus-sociali', FALSE, TRUE, FALSE, '[]'),
('Servizi di Patronato', 'servizi-patronato', FALSE, TRUE, TRUE, '["PENSIONI", "RICOSTITUZIONI", "INVALIDITÀ", "NASPI"]'),
('Appuntamento Generico', 'appuntamento-generico', FALSE, TRUE, FALSE, '[]')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO email_templates (template_name, subject, body, variables) VALUES
('confirmation', 'Conferma Prenotazione - Nico Villano', 
'Gentile [Nome], la sua prenotazione per [Servizio] è confermata per [Data] alle [Ora]. DETTAGLI: Servizio [Servizio] presso Nico Villano, Via Corigliano 6. Per cancellare (almeno 24h prima): [Link]. Info: Tel. 3204283508 - nicovillano@libero.it', 
'["Nome", "Servizio", "Data", "Ora", "Link"]'),

('reminder', 'Promemoria Appuntamento - Nico Villano',
'Promemoria: domani alle [Ora] ha appuntamento per [Servizio] presso Nico Villano, Via Corigliano 6. La aspettiamo puntualmente. Per info: Tel. 3204283508 - nicovillano@libero.it',
'["Ora", "Servizio"]'),

('cancellation', 'Cancellazione Appuntamento - Nico Villano',
'Gentile [Nome], confermiamo la cancellazione del suo appuntamento per [Servizio] del [Data] alle [Ora]. Per nuove prenotazioni: Tel. 3204283508 - nicovillano@libero.it. Cordiali saluti, Nico Villano',
'["Nome", "Servizio", "Data", "Ora"]'),

('closure_emergency', 'Annullamento Appuntamento',
'Gentile [Nome], il suo appuntamento di oggi alle [Ora] è stato annullato per [Motivo]. La ricontatteremo al più presto per riprogrammare. Ci scusiamo per l''inconveniente. Nico Villano - 3204283508',
'["Nome", "Ora", "Motivo"]'),

('closure_planned', 'Annullamento Appuntamento',
'Gentile [Nome], il suo appuntamento del [Data] alle [Ora] per [Servizio] è stato annullato per [Motivo]. La ricontatteremo per riprogrammare. Ci scusiamo per l''inconveniente. Nico Villano - Via Corigliano 6 - Tel. 3204283508',
'["Nome", "Data", "Ora", "Servizio", "Motivo"]'),

('closure_vacation', 'Annullamento Appuntamento',
'Gentile [Nome], il suo appuntamento del [Data] è stato annullato per chiusura estiva. Saremo di nuovo operativi dal [DataRiapertura]. La ricontatteremo per riprogrammare. Nico Villano - 3204283508',
'["Nome", "Data", "DataRiapertura"]')
ON CONFLICT (template_name) DO NOTHING;

INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('business_hours', '{"lunedi":["16:00","19:00"],"martedi":["16:00","19:00"],"mercoledi":["09:00","12:00"],"giovedi":["16:00","19:00"],"venerdi":["09:00","12:00"]}', 'json', 'Orari di lavoro settimanali'),
('appointment_duration', '15', 'integer', 'Durata appuntamenti in minuti'),
('booking_advance_min', '0', 'integer', 'Giorni minimi anticipo prenotazione'),
('booking_advance_max', '15', 'integer', 'Giorni massimi anticipo prenotazione'),
('cancellation_hours', '24', 'integer', 'Ore minime per cancellazione'),
('max_files_upload', '5', 'integer', 'Massimo file per upload'),
('max_file_size', '10485760', 'integer', 'Dimensione massima file in bytes (10MB)')
ON CONFLICT (setting_key) DO NOTHING;
