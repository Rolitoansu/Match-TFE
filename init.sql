CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    biography TEXT
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE professors (
    id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL
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

CREATE TABLE student_skills (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    mark INTEGER CHECK (mark >= 0 AND mark <= 10),
    PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE matches (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    professor_id INTEGER REFERENCES professors(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    match_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, professor_id)
);

CREATE TABLE chats (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    professor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
    creation_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, professor_id)
);

CREATE TABLE messages (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT FALSE,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE Projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'in_progress', 'completed')),
    publication_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '12 months'),
    tutor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL
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

CREATE TABLE proposal_likes (
    proposal_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id)
);

CREATE TABLE proposal_passes (
    proposal_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id)
);

CREATE TABLE user_tags (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

-- Seed default admin user (password: admin123)
-- Hash generated with bcrypt, 10 rounds
-- By now, it is admin123
INSERT INTO administrators (email, password_hash) VALUES 
    ('admin@matchtfe.com', '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i');

-- Seed mock professors (password for all: admin123)
INSERT INTO users (name, surname, password_hash, email, biography) VALUES
    (
        'Marta',
        'Suarez',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'marta.suarez@uni.es',
        'Profesora de IA aplicada. Busco estudiantes con interes en NLP y sistemas inteligentes.'
    ),
    (
        'Javier',
        'Llaneza',
        '$2b$10$4hVb1Fxcv.Qbj2fCUkdcSO59YT4WvsoQi7LDHiIAfEF3FJIQXT43i',
        'javier.llaneza@uni.es',
        'Profesor de ciberseguridad y sistemas distribuidos. Interesado en proyectos aplicados.'
    );

INSERT INTO professors (id, department)
SELECT id, 'Informatica'
FROM users
WHERE email = 'marta.suarez@uni.es';

INSERT INTO professors (id, department)
SELECT id, 'Ingenieria Telematica'
FROM users
WHERE email = 'javier.llaneza@uni.es';

-- Seed mock tags
INSERT INTO tags (name) VALUES
    ('NLP'),
    ('Machine Learning'),
    ('Ciberseguridad'),
    ('Sistemas Distribuidos'),
    ('Vision Artificial')
ON CONFLICT (name) DO NOTHING;

-- Seed mock TFG proposals published by professors (visible in Explore for students)
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

-- Relate tags with professor proposals
INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p
JOIN tags t ON t.name IN ('NLP', 'Machine Learning')
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