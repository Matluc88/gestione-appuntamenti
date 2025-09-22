
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
('confirmation', 'Conferma Appuntamento - Nico Villano Consulenza', 
'Gentile [Nome],

La sua prenotazione è stata confermata con successo.

DETTAGLI APPUNTAMENTO:
• Servizio: [Servizio]
• Data: [Data]
• Orario: [Ora]
• Presso: Nico Villano - Via Corigliano 6

INFORMAZIONI UTILI:
• Per modifiche o cancellazioni (almeno 24 ore prima): [Link]
• Contatti: Tel. 3204283508 | Email: nicovillano@libero.it

La ringraziamo per la fiducia accordataci.

Cordiali saluti,
Nico Villano
Consulenza Fiscale e Patronato', 
'["Nome", "Servizio", "Data", "Ora", "Link"]'),

('reminder', 'Promemoria Appuntamento - Nico Villano',
'Gentile Cliente,

Le ricordiamo il suo appuntamento programmato per domani:

• Orario: [Ora]
• Servizio: [Servizio]
• Presso: Nico Villano - Via Corigliano 6

La aspettiamo puntualmente.

Per informazioni: Tel. 3204283508 | Email: nicovillano@libero.it

Cordiali saluti,
Nico Villano',
'["Ora", "Servizio"]'),

('cancellation', 'Conferma Cancellazione - Nico Villano',
'Gentile [Nome],

Confermiamo la cancellazione del suo appuntamento:

• Servizio: [Servizio]
• Data: [Data]
• Orario: [Ora]

Per nuove prenotazioni, non esiti a contattarci:
Tel. 3204283508 | Email: nicovillano@libero.it

Cordiali saluti,
Nico Villano
Consulenza Fiscale e Patronato',
'["Nome", "Servizio", "Data", "Ora"]'),

('closure_emergency', 'Modifica Appuntamento - Nico Villano',
'Gentile [Nome],

A causa di [Motivo], il suo appuntamento di oggi alle [Ora] deve essere riprogrammato.

Il nostro staff la contatterà al più presto per concordare una nuova data.

Ci scusiamo per l''inconveniente.

Nico Villano
Tel. 3204283508',
'["Nome", "Ora", "Motivo"]'),

('closure_planned', 'Riprogrammazione Appuntamento - Nico Villano',
'Gentile [Nome],

Il suo appuntamento del [Data] alle [Ora] per [Servizio] deve essere riprogrammato a causa di [Motivo].

Il nostro staff la contatterà per concordare una nuova data.

Ci scusiamo per l''inconveniente.

Nico Villano
Via Corigliano 6 - Tel. 3204283508',
'["Nome", "Data", "Ora", "Servizio", "Motivo"]'),

('closure_vacation', 'Riprogrammazione Appuntamento - Nico Villano',
'Gentile [Nome],

Il suo appuntamento del [Data] deve essere riprogrammato a causa della chiusura estiva.

Saremo nuovamente operativi dal [DataRiapertura] e la contatteremo per concordare una nuova data.

Cordiali saluti,
Nico Villano
Tel. 3204283508',
'["Nome", "Data", "DataRiapertura"]'),

('admin_notification', 'Nuovo Appuntamento Prenotato - Gestione Appuntamenti',
'Nuovo appuntamento prenotato:

DETTAGLI CLIENTE:
• Nome: [Nome]
• Email: [Email]
• Telefono: [Telefono]

DETTAGLI APPUNTAMENTO:
• Servizio: [Servizio]
• Data: [Data]
• Orario: [Ora]
• Note: [Note]

Accedi al pannello admin per gestire l''appuntamento.

Sistema Gestione Appuntamenti',
'["Nome", "Email", "Telefono", "Servizio", "Data", "Ora", "Note"]'),

('information_request', 'Richiesta Informazioni Ricevuta - Nico Villano',
'Gentile [Nome],

Abbiamo ricevuto la sua richiesta di informazioni per il servizio: [Servizio]

DETTAGLI RICHIESTA:
• Servizio: [Servizio]
• Note: [Note]
• File allegati: [FileCount] file

La contatteremo al più presto per fornirle le informazioni richieste.

Cordiali saluti,
Nico Villano
Consulenza Fiscale e Patronato
Tel. 3204283508 | Email: nicovillano@libero.it',
'["Nome", "Servizio", "Note", "FileCount"]'),

('admin_information_request', 'Nuova Richiesta Informazioni - Gestione Appuntamenti',
'Nuova richiesta informazioni ricevuta:

DETTAGLI CLIENTE:
• Nome: [Nome]
• Email: [Email]
• Telefono: [Telefono]

DETTAGLI RICHIESTA:
• Servizio: [Servizio]
• Note: [Note]
• File allegati: [FileCount] file

TIPO: Richiesta informazioni (non appuntamento)

Accedi al pannello admin per gestire la richiesta.

Sistema Gestione Appuntamenti',
'["Nome", "Email", "Telefono", "Servizio", "Note", "FileCount"]')
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
