#!/bin/bash

echo "🚀 Configurando frontend de SubastaApp..."

# Verificar si estamos en el directorio correcto
if [ ! -d "backend" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto (donde está la carpeta backend)"
    exit 1
fi

# Eliminar frontend si existe
if [ -d "frontend" ]; then
    echo "🗑️  Eliminando frontend existente..."
    rm -rf frontend
fi

# Crear nueva aplicación React
echo "📦 Creando nueva aplicación React..."
npx create-react-app frontend
cd frontend

# Instalar dependencias
echo "📋 Instalando dependencias..."
npm install axios react-router-dom framer-motion react-icons

# Crear estructura de carpetas
echo "📁 Creando estructura de carpetas..."
mkdir -p src/{components,pages,services,context,utils,hooks}
mkdir -p src/components/{common,auth,products,layout}
mkdir -p src/pages/{auth,products,dashboard}

# Crear archivo .env
echo "⚙️  Creando archivo de configuración..."
cat > .env << EOL
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
EOL

echo "✅ Frontend configurado correctamente!"
echo "📝 Ahora necesitas recrear los archivos de componentes manualmente o usar los artifacts proporcionados."
echo ""
echo "Para iniciar el servidor frontend:"
echo "cd frontend && npm start"
