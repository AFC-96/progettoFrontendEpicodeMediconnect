# MediConnect 

## Overview

MediConnect è una web application full-stack (backend mock) per la gestione di visite mediche online. La piattaforma consente ai pazienti di prenotare appuntamenti, consultare la propria storia clinica e gestire il proprio profilo medico, mentre i dottori possono gestire le visite, creare consultazioni e visualizzare la storia clinica dei pazienti.

L'applicazione utilizza un sistema di autenticazione basato su ruoli (PATIENT / DOCTOR) con route guards che proteggono le pagine in base al tipo di utente.


## Features

### Autenticazione & Sicurezza
- Registrazione pazienti e dottori con ruoli differenziati
- Login con token JWT (mock)
- Reset e aggiornamento password
- Route guards per protezione pagine (Patient-only, Doctor-only, Shared)

### Gestione Profilo
- Profilo paziente con dati medici (gruppo sanguigno, genotipo, allergie)
- Profilo dottore con specializzazione e numero di licenza
- Upload foto profilo
- Modifica profilo e password

### Appuntamenti
- Prenotazione appuntamenti con selezione dottore, data e ora
- Visualizzazione appuntamenti personali (paziente)
- Gestione appuntamenti in arrivo (dottore)
- Cancellazione e completamento appuntamenti

### Consultazioni
- Creazione consultazione medica da parte del dottore
- Storico consultazioni per il paziente
- Storico consultazioni per paziente (vista dottore)

### UI/UX
- Design responsive (mobile, tablet, desktop)
- Palette colori Ocean Health (Teal & Emerald)
- Animazioni e transizioni fluide
- Componenti riutilizzabili (Navbar, Footer)
- Modale di conferma per azioni critiche

## Tecnologie

Categoria | Tecnologia | Versione

Framework | React | 19.2.6 
Build Tool | Vite | 8.0.12
Routing | React Router DOM | 7.15.1
State Management | Redux Toolkit + React Redux | 2.12.0 / 9.3.0
Forms | React Hook Form + Yup | 7.76.1 / 1.7.1
HTTP Client | Axios | 1.16.1 
Mock API | JSON Server | 0.17.4
Linting | ESLint | 10.3.0
Styling | Vanilla CSS 

## Struttura del Progetto

MediConnect/
├── src/
│   ├── components/          # Componenti riutilizzabili
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── pages/               # Pagine dell'applicazione
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── DoctorRegister.jsx
│   │   ├── Profile.jsx
│   │   ├── UpdateProfile.jsx
│   │   ├── BookAppointment.jsx
│   │   ├── MyAppointments.jsx
│   │   ├── ConsultationHistory.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── UpdatePassword.jsx
│   │   └── doctors/         # Pagine specifiche per dottori
│   │       ├── DoctorProfile.jsx
│   │       ├── UpdateDoctorProfile.jsx
│   │       ├── DoctorAppointments.jsx
│   │       ├── CreateConsultation.jsx
│   │       └── PatientConsultationHistory.jsx
│   ├── services/            # Servizi e utilities
│   │   ├── api.js           # Client API (Axios)
│   │   └── Guard.jsx        # Route guards (auth)
│   ├── store/               # Redux store
│   │   ├── store.js
│   │   └── authSlice.js
│   ├── mock/                # Dati mock
│   │   ├── db.json
│   │   └── routes.json
│   ├── App.jsx              # Root component + routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Stili globali
├── mock-server.cjs          # Server mock con middleware custom
├── db.json                  # Database JSON Server
├── package.json
├── vite.config.js
└── index.html

## Getting Started

### Prerequisiti

Node.js ≥ 18.x
npm ≥ 9.x

### Installazione

# 1. Clona il repository
git clone https://github.com/your-username/MediConnect.git
cd MediConnect

# 2. Installa le dipendenze
npm install

### Avvio in Sviluppo

Utilizzare due terminali separati:

# Terminale 1 — Avviare il Mock API Server (porta 8086)
npm run mock

# Terminale 2 — Avviare il Frontend (porta 5173)
npm run dev

Aprire il browser su http://localhost:5173

### Credenziali di Test

Il mock server fornisce credenziali preconfigurate all'avvio. Per registrare nuovi utenti:

# Registra un paziente con i seguenti 
curl -X POST http://localhost:8086/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"pwd123","roles":["PATIENT"]}'

# Registra un dottore
curl -X POST http://localhost:8086/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Jane","email":"jane@example.com","password":"pwd123","roles":["DOCTOR"],"specialization":"CARDIOLOGY","licenseNumber":"MED-12345"}'
```

### Build di Produzione

npm run build
npm run preview

## Scripts Disponibili

Comando | Descrizione 
npm run dev | Avvia il server di sviluppo Vite 
npm run mock | Avvia il mock API server (JSON Server) 
npm run build | Build di produzione 
npm run preview | Preview della build di produzione
npm run lint | Esegue ESLint 

## Rotte dell'Applicazione

### Pubbliche
Rotta | Pagina 
/home | Homepage
/login | Login
/register | Registrazione paziente 
/register-doctor | Registrazione dottore 
/forgot-password | Recupero password 
/reset-password | Reset password 

### Solo Pazienti 
Rotta | Pagina
/profile | Profilo paziente 
/update-profile | Modifica profilo
/book-appointment | Prenota appuntamento
/my-appointments | I miei appuntamenti 
/consultation-history | Storico consultazioni 

### Solo Dottori
Rotta | Pagina 
/doctor/profile | Profilo dottore 
/doctor/update-profile | Modifica profilo 
/doctor/appointments | Gestione appuntamenti 
/doctor/create-consultation | Crea consultazione
/doctor/patient-consultation-history | Storico paziente 

### Condivise 
Rotta | Pagina 
/update-password | Aggiorna password
