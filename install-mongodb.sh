#!/bin/bash

# MongoDB Installation Script - Multi-OS Support
# Run this script with: chmod +x install-mongodb.sh && ./install-mongodb.sh

set -e

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Interactive OS selection
echo "🚀 MongoDB Installation Script"
echo ""
echo "Select your operating system:"
echo "1) Ubuntu/Debian"
echo "2) Amazon Linux 2023"
echo "3) CentOS/RHEL 8/9"
echo "4) Fedora"
echo ""
read -p "Enter your choice (1-4): " os_choice

case $os_choice in
    1)
        OS_TYPE="ubuntu"
        echo "✅ Selected: Ubuntu/Debian"
        ;;
    2)
        OS_TYPE="amazon"
        echo "✅ Selected: Amazon Linux 2023"
        ;;
    3)
        OS_TYPE="centos"
        echo "✅ Selected: CentOS/RHEL"
        ;;
    4)
        OS_TYPE="fedora"
        echo "✅ Selected: Fedora"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🚀 Installing MongoDB on $OS_TYPE..."

# Update system and install MongoDB based on OS
if [ "$OS_TYPE" = "ubuntu" ]; then
    # Ubuntu/Debian
    echo "📦 Updating system packages..."
    apt-get update -y
    
    echo "📦 Installing dependencies..."
    apt-get install -y gnupg curl
    
    echo "📝 Adding MongoDB GPG key..."
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    echo "📝 Creating MongoDB repository..."
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    echo "📦 Updating package list..."
    apt-get update -y
    
    echo "📦 Installing MongoDB..."
    apt-get install -y mongodb-org

elif [ "$OS_TYPE" = "amazon" ]; then
    # Amazon Linux 2023
    echo "📦 Updating system packages..."
    dnf update -y
    
    echo "📝 Creating MongoDB repository..."
    cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
    
    echo "📦 Installing MongoDB..."
    dnf install -y mongodb-org

elif [ "$OS_TYPE" = "centos" ]; then
    # CentOS/RHEL 8/9
    echo "📦 Updating system packages..."
    dnf update -y
    
    echo "📝 Creating MongoDB repository..."
    cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
    
    echo "📦 Installing MongoDB..."
    dnf install -y mongodb-org

elif [ "$OS_TYPE" = "fedora" ]; then
    # Fedora
    echo "📦 Updating system packages..."
    dnf update -y
    
    echo "📝 Creating MongoDB repository..."
    cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
    
    echo "📦 Installing MongoDB..."
    dnf install -y mongodb-org
fi

# Create MongoDB directories
echo "📁 Creating MongoDB directories..."
mkdir -p /var/lib/mongo
mkdir -p /var/log/mongodb

# Detect MongoDB user (different on Ubuntu vs other distros)
if id "mongodb" &>/dev/null; then
    MONGO_USER="mongodb"
    MONGO_GROUP="nogroup"
elif id "mongod" &>/dev/null; then
    MONGO_USER="mongod"
    MONGO_GROUP="mongod"
else
    echo "⚠️ Warning: MongoDB user not found, skipping permission setup"
    MONGO_USER=""
fi

if [ -n "$MONGO_USER" ]; then
    chown -R $MONGO_USER:$MONGO_GROUP /var/lib/mongo
    chown -R $MONGO_USER:$MONGO_GROUP /var/log/mongodb
    echo "✅ Set permissions for user: $MONGO_USER"
fi

# Create MongoDB configuration
echo "⚙️ Creating MongoDB configuration..."
cat > /etc/mongod.conf << 'EOF'
# mongod.conf

# for documentation of all options, see:
#   http://docs.mongodb.org/manual/reference/configuration-options/

# Where to store data.
storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# Process management
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Security
security:
  authorization: disabled

# Operation profiling
operationProfiling:
  slowOpThresholdMs: 100

# Replication
# replSetName: rs0

# Sharding
# sharding:
#   clusterRole: configsvr
EOF

# Enable and start MongoDB
echo "🔄 Enabling and starting MongoDB service..."
systemctl enable mongod
systemctl start mongod

# Wait for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 5

# Check MongoDB status
if systemctl is-active --quiet mongod; then
    echo "✅ MongoDB installed and started successfully!"
    echo "📊 MongoDB status:"
    systemctl status mongod --no-pager -l
else
    echo "❌ MongoDB failed to start. Checking logs..."
    journalctl -u mongod --no-pager -l
    exit 1
fi

# Create Manda2 database and user
echo "🔧 Setting up Manda2 database..."
mongosh --eval '
use manda2;
db.createCollection("usuarios");
db.createCollection("productos");
db.createCollection("pedidos");
db.createCollection("tiendas");

// Create indexes for better performance
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ telefono: 1 });
db.usuarios.createIndex({ rol: 1 });

db.productos.createIndex({ tienda: 1 });
db.productos.createIndex({ categoria: 1 });
db.productos.createIndex({ activo: 1 });

db.pedidos.createIndex({ cliente: 1 });
db.pedidos.createIndex({ tienda: 1 });
db.pedidos.createIndex({ repartidor: 1 });
db.pedidos.createIndex({ estado: 1 });
db.pedidos.createIndex({ fecha: -1 });

print("✅ Manda2 database and collections created successfully!");
'

echo ""
echo "🎉 MongoDB installation completed!"
echo ""
echo "📋 MongoDB Information:"
echo "   Port: 27017"
echo "   Data directory: /var/lib/mongo"
echo "   Log file: /var/log/mongodb/mongod.log"
echo "   Configuration: /etc/mongod.conf"
echo ""
echo "📊 Useful commands:"
echo "   Check status: sudo systemctl status mongod"
echo "   Start: sudo systemctl start mongod"
echo "   Stop: sudo systemctl stop mongod"
echo "   Restart: sudo systemctl restart mongod"
echo "   Connect: mongosh"
echo ""
echo "🔗 Connection URI for Manda2 app:"
echo "   MONGODB_URI=mongodb://localhost:27017/manda2"
