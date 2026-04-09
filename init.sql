-- Seed-only script.
-- Schema is created by Drizzle from database/schema.ts via `db-init`.

-- Seed default admin user (password: admin123)
INSERT INTO administrators (email, password_hash) VALUES
    ('admin@matchtfe.com', '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i');

-- Seed mock users (password for all: admin123)
INSERT INTO users (name, surname, password_hash, email, biography, role) VALUES
    (
        'Marta',
        'Suarez',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'marta.suarez@uni.es',
        'Profesora de IA aplicada. Busco estudiantes con interes en DLP y sistemas inteligentes.',
        'professor'
    ),
    (
        'Javier',
        'Llaneza',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'javier.llaneza@uni.es',
        'Profesor de ciberseguridad y sistemas distribuidos. Interesado en proyectos aplicados.',
        'professor'
    ),
    (
        'Lucia',
        'Fernandez',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'lucia.fernandez@uni.es',
        'Estudiante interesada en DLP y productos digitales.',
        'student'
    ),
    (
        'Carlos',
        'Lopez',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'carlos.lopez@uni.es',
        'Estudiante con foco en ciberseguridad y sistemas distribuidos.',
        'student'
    );

-- Seed tags
INSERT INTO tags (name) VALUES
    ('DLP'),
    ('Machine Learning'),
    ('Ciberseguridad'),
    ('Sistemas Distribuidos'),
    ('Vision Artificial')
ON CONFLICT (name) DO NOTHING;

-- Seed professor proposals
INSERT INTO projects (title, description, status, proposer_id) VALUES
    (
        'Asistente conversacional para campus universitario',
        'Diseno e implementacion de un asistente conversacional con RAG para resolver dudas academicas y administrativas.',
        'proposed',
        (SELECT id FROM users WHERE email = 'marta.suarez@uni.es')
    ),
    (
        'Clasificacion automatica de incidencias TI',
        'Uso de modelos de machine learning para categorizar y priorizar tickets de soporte tecnico en tiempo real.',
        'proposed',
        (SELECT id FROM users WHERE email = 'marta.suarez@uni.es')
    ),
    (
        'Deteccion de anomalias en trafico de red',
        'Analisis de trafico de red y deteccion de comportamientos anomalos con tecnicas de aprendizaje supervisado y no supervisado.',
        'proposed',
        (SELECT id FROM users WHERE email = 'javier.llaneza@uni.es')
    ),
    (
        'Arquitectura segura de microservicios para TFG Match',
        'Propuesta de arquitectura de microservicios con autenticacion robusta, observabilidad y hardening de seguridad.',
        'proposed',
        (SELECT id FROM users WHERE email = 'javier.llaneza@uni.es')
    );

-- Seed student proposals
INSERT INTO projects (title, description, status, proposer_id) VALUES
    (
        'Sistema de recomendacion de TFGs',
        'Plataforma para recomendar TFGs en funcion de intereses, habilidades y experiencia previa.',
        'proposed',
        (SELECT id FROM users WHERE email = 'lucia.fernandez@uni.es')
    ),
    (
        'Monitorizacion de rendimiento en microservicios',
        'Analitica y observabilidad para detectar cuellos de botella en arquitecturas distribuidas.',
        'proposed',
        (SELECT id FROM users WHERE email = 'carlos.lopez@uni.es')
    );

-- Relate tags with proposals
INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('DLP', 'Machine Learning')
WHERE p.title = 'Asistente conversacional para campus universitario'
ON CONFLICT DO NOTHING;

INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('Machine Learning')
WHERE p.title = 'Clasificacion automatica de incidencias TI'
ON CONFLICT DO NOTHING;

INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('Ciberseguridad', 'Sistemas Distribuidos')
WHERE p.title = 'Deteccion de anomalias en trafico de red'
ON CONFLICT DO NOTHING;

INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('Ciberseguridad', 'Sistemas Distribuidos')
WHERE p.title = 'Arquitectura segura de microservicios para TFG Match'
ON CONFLICT DO NOTHING;

INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('Machine Learning', 'Sistemas Distribuidos')
WHERE p.title = 'Sistema de recomendacion de TFGs'
ON CONFLICT DO NOTHING;

INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('Ciberseguridad', 'Sistemas Distribuidos')
WHERE p.title = 'Monitorizacion de rendimiento en microservicios'
ON CONFLICT DO NOTHING;

-- Seed match interactions (source of truth)
INSERT INTO matches (user_id, project_id, status)
VALUES
    (
        (SELECT id FROM users WHERE email = 'lucia.fernandez@uni.es'),
        (SELECT id FROM projects WHERE title = 'Asistente conversacional para campus universitario' LIMIT 1),
        'pending'
    ),
    (
        (SELECT id FROM users WHERE email = 'javier.llaneza@uni.es'),
        (SELECT id FROM projects WHERE title = 'Monitorizacion de rendimiento en microservicios' LIMIT 1),
        'accepted'
    )
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Seed user interests (user_tags)
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id
FROM users u, tags t
WHERE u.email = 'lucia.fernandez@uni.es' AND t.name IN ('DLP', 'Machine Learning')
ON CONFLICT DO NOTHING;

INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id
FROM users u, tags t
WHERE u.email = 'carlos.lopez@uni.es' AND t.name IN ('Ciberseguridad', 'Sistemas Distribuidos')
ON CONFLICT DO NOTHING;

INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id
FROM users u, tags t
WHERE u.email = 'marta.suarez@uni.es' AND t.name IN ('DLP', 'Machine Learning')
ON CONFLICT DO NOTHING;

INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id
FROM users u, tags t
WHERE u.email = 'javier.llaneza@uni.es' AND t.name IN ('Ciberseguridad', 'Sistemas Distribuidos')
ON CONFLICT DO NOTHING;
