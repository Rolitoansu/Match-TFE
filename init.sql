CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    biography TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor'))
);

CREATE TABLE administrators (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE skills (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE user_skills (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    mark INTEGER CHECK (mark >= 0 AND mark <= 10),
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'in_progress', 'completed')),
    publication_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 months'),
    tutor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE matches (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE notifications (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE project_tags (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE user_tags (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

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
INSERT INTO projects (title, description, status, tutor_id) VALUES
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
INSERT INTO projects (title, description, status, student_id) VALUES
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
