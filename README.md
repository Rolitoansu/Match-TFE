# 🎓 MATCH-TFE

[![Docker Support](https://img.shields.io/badge/Docker-Supported-blue?logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
POSTGRES_USER=<admin_user>        # Admin name for the database instance
POSTGRES_PASSWORD=<your_password> # Password for the database
POSTGRES_DB=<database_name>       # Name of the database
```

### 2. Launching the System

Ensure you have **Docker** installed on your system and run the following command in your terminal:

```bash
docker compose up -d
```
or just
```bash
docker compose up
```

> [!NOTE] The `-d` flag runs the containers in detached mode (background). If you need to see the real-time logs, you can use `docker compose logs -f`.