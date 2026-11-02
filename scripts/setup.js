#!/usr/bin/env node
// Crea los .env locales a partir de los ejemplos, con un JWT_SECRET propio.
// No sobrescribe archivos que ya existan.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');

const crear = (carpeta, transformar = (t) => t) => {
  const destino = path.join(root, carpeta, '.env');
  if (fs.existsSync(destino)) {
    console.log(`= ${carpeta}/.env ya existe, no se toca`);
    return;
  }
  const base = fs.readFileSync(path.join(root, carpeta, '.env.example'), 'utf8');
  fs.writeFileSync(destino, transformar(base));
  console.log(`+ ${carpeta}/.env creado`);
};

crear('backend', (t) => t.replace('JWT_SECRET=cambia-este-valor', `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`));
crear('frontend');
