# 🎓 MATCH-TFE

[![Docker Support](https://img.shields.io/badge/Docker-Supported-blue?logo=docker)](https://www.docker.com/)

**MATCH-TFE** is a web-based platform designed to optimize the coordination and assignment of Bachelor's Theses (TFE) within the **School of Computer Engineering**.

## 🎯 The Problem
The current model is "proposal-heavy": professors are forced to publish an excessive number of specific titles just to ensure all students are covered. Match-TFE streamlines this by connecting students and tutors more efficiently.

---

## 🚀 Quick Start (Deployment)

Follow these steps to get the environment up and running using Docker.

### 1. Environment Configuration
Create a `.env` file in the **root folder** of the project and define the following variables:

```bash
# Database Configuration
DB_HOST=<database_host>         # Database URL
DB_PORT=<port>                  # Database port
DB_USER=<admin_user>            # Admin name for the database instance
DB_PASSWORD=<admin_password>    # Password for the database
DB_NAME=<database_name>         # Name of the database       

# Notification Service (SMTP)
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_password>
SMTP_FROM=<optional_sender_email>
NOTIFICATION_TIMEZONE=<optional_timezone>          # default: Europe/Madrid
PENDING_MATCHES_CRON=<optional_cron_expression>    # default: 0 * * * * (cada hora, se filtra por preferencias de usuario)
PENDING_MATCHES_SUBJECT=<optional_email_subject>
```

Los correos de recordatorio se envian automaticamente por usuario segun su frecuencia y hora configuradas, e incluyen un resumen de notificaciones pendientes por leer.

### 2. Launching the System

Ensure you have **Docker** installed on your system and run the following command in your terminal:

```bash
docker compose up -d
```
or just
```bash
docker compose up
```
The `-d` flag runs the containers in detached mode (background). If you need to see the real-time logs, you can use `docker compose logs -f`.

### Notification API

The gateway now exposes an endpoint to send emails to students:

```bash
POST /notifications/students/email
```

Body example:

```json
{
	"subject": "Recordatorio TFG",
	"message": "Esta semana revisamos vuestro avance.",
	"studentIds": [3, 4]
}
```