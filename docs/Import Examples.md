# Guía de Importación - Panel de Administración

## Formatos de Archivos CSV

### 1. Importar Estudiantes

**Archivo: `estudiantes.csv`**

```csv
correo,nombre,apellido
juan.perez@domain.com,Juan,Pérez
maria.garcia@domain.com,María,García
carlos.lopez@domain.com,Carlos,López
```

**Columnas obligatorias:**
- `correo` - Email válido del estudiante
- `nombre` - Nombre del estudiante (mínimo 2 caracteres)
- `apellido` - Apellido del estudiante (mínimo 2 caracteres)

**Detalles:**
- Contraseña por defecto: parte del email antes de @ (ej: juan -> contraseña: juan)
- Máximo 2 MB por archivo
- Los estudiantes duplicados (mismo email) se omiten

---

### 2. Importar Profesores

**Archivo: `profesores.csv`**

```csv
correo,nombre,apellido
prof.anderson@domain.com,Robert,Anderson
prof.smith@domain.com,Sarah,Smith
prof.johnson@domain.com,Michael,Johnson
```

**Columnas obligatorias:**
- `correo` - Email válido del profesor
- `nombre` - Nombre del profesor (mínimo 2 caracteres)
- `apellido` - Apellido del profesor (mínimo 2 caracteres)

**Detalles:**
- Contraseña por defecto: parte del email antes de @ (ej: prof.anderson -> contraseña: prof)
- Máximo 2 MB por archivo
- Los profesores duplicados se omiten

---

### 3. Importar Etiquetas

**Archivo: `etiquetas.csv`**

```csv
nombre
Inteligencia Artificial
Desarrollo Web
Base de Datos
Seguridad Informática
Desarrollo Móvil
Machine Learning
Diseño de Interfaces
Cloud Computing
DevOps
Blockchain
```

**Columnas obligatorias:**
- `nombre` - Nombre de la etiqueta (máximo 100 caracteres)

**Detalles:**
- Máximo 2 MB por archivo
- Las etiquetas duplicadas se omiten
- Los nombres se trimean automáticamente

---

## Cómo Usar el Panel

### Acceder al Panel

1. Ir a `/admin/login`
2. Credenciales por defecto:
   - Email: `admin@matchtfe.com`
   - Contraseña: `admin123`

### Importaciones

1. **Navega a la pestaña** correspondiente (Estudiantes, Profesores, Etiquetas)
2. **Arrastra o haz clic** para seleccionar el archivo CSV
3. **Verifica** los datos en la vista previa
4. **Haz clic en Importar** para confirmar

### Gestión de Usuarios

1. Navega a la pestaña **"Gestionar Usuarios"**
2. **Busca** usuarios por email o nombre
3. **Filtra** por tipo (Estudiantes, Profesores)
4. **Edita** información del usuario
5. **Elimina** usuarios si es necesario

### Gestión de Etiquetas

1. En la pestaña **"Etiquetas"**
2. **Crea** nuevas etiquetas manualmente
3. **Edita** nombres de etiquetas existentes
4. **Elimina** etiquetas no usadas
5. **Importa** múltiples a la vez desde CSV

---

## Validaciones

### Estudiantes/Profesores
- Email válido (formato: usuario@dominio.com)
- Nombre mínimo 2 caracteres
- Apellido mínimo 2 caracteres
- No se permiten emails duplicados

### Etiquetas
- Nombre no vacío
- Máximo 100 caracteres
- No se permiten nombres duplicados (case-insensitive)

---

## Resultados de Importación

Después de cada importación verás:
- ✅ Cantidad de usuarios/etiquetas **creados**
- ⏭️ Cantidad **omitidos** (duplicados o inválidos)
- ⚠️ **Errores** detectados (máximo 5 mostrados)

---

## Contraseñas Generadas

Las contraseñas generadas automáticamente durante la importación son:
- **Seguras** (hasheadas con bcrypt, 10 rondas)
- **Basadas en el email** (parte antes de @)
- **Ejemplo:**
  - Email: `juan.perez@domain.com` → Contraseña: `juan`
  - Email: `m.garcia@domain.com` → Contraseña: `m`

**Se recomienda** pedir a los usuarios que cambien la contraseña en la primera sesión.

---

## Próximos Pasos

Después de importar usuarios:

1. Comunica las **credenciales de acceso** a los usuarios
2. Los usuarios pueden **actualizar su perfil** en la sección de Perfil
3. Los estudiantes pueden **indicar sus intereses** (tags)
4. Los profesores pueden **crear TFGs** (proyectos)

---

## Soporte

Si encuentras errores durante la importación:
- Verifica el **formato del CSV**
- Asegúrate de que los **emails sean válidos**
- Revisa que **no haya campos vacíos**
- Comprueba que el archivo sea **menor a 2 MB**
