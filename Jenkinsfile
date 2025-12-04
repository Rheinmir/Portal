pipeline {
    agent { label 'dockerlinux' }

    triggers {
        githubPush()
    }

    stages {
        stage('Pull Source') {
            steps {
                sh 'git status'
            }
        }
        stage('Build & Deploy') {
            steps {
                sh """
                docker stop shortcut-manager-sqlite-server || true
                docker rm shortcut-manager-sqlite-server || true
                docker rmi shortcut-manager-sqlite-server || true
                docker build -t shortcut-manager-sqlite-server .
                docker run -d --name shortcut-manager-sqlite-server -p 5464:5464 -v /Users/giatran/shortcutmanager-data:/app/data shortcut-manager-sqlite-server
                """
            }
        }
    }
}