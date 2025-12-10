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
                script {
                    def gitCommit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    def imageName = "shortcut-manager-sqlite-server"
                    def imageTag = "${imageName}:${gitCommit}"
                    
                    echo "Checking for prebuilt image: ${imageTag}"
                    
                    // Check if image exists locally
                    def imageExists = sh(script: "docker images -q ${imageTag}", returnStdout: true).trim()
                    
                    if (!imageExists) {
                        echo "Image not found. Building..."
                        sh "docker build -t ${imageTag} ."
                    } else {
                        echo "Image ${imageTag} found. Skipping build."
                    }

                    // Always stop/remove old container and run new one
                    sh """
                    docker stop ${imageName} || true
                    docker rm ${imageName} || true
                    # We do NOT remove the image here because we might want to reuse it or we just built it
                    
                    docker run -d --name ${imageName} -p 5464:5464 -v /Users/giatran/shortcutmanager-data:/app/data ${imageTag}
                    """
                }
            }
        }
    }
}