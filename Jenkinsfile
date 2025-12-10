pipeline {
    agent { label 'dockerlinux' }
    
    environment {
        // Change 'rheinmir' to your GitHub username (lowercase)
        // Change 'portal' to your desired package name
        REGISTRY = 'ghcr.io'
        IMAGE_REPO = 'rheinmir/portal'
        CONTAINER_NAME = 'shortcut-manager-server'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Pull Source') {
            steps {
                sh 'git status'
            }
        }
        
        stage('Login to GHCR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-registry-auth', passwordVariable: 'GH_TOKEN', usernameVariable: 'GH_USER')]) {
                    // Using sh with script block for better error handling visibility
                    sh 'docker login ghcr.io -u "$GH_USER" -p "$GH_TOKEN"'
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    def gitCommit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    def fullImageName = "${REGISTRY}/${IMAGE_REPO}:${gitCommit}"
                    def latestImageName = "${REGISTRY}/${IMAGE_REPO}:latest"
                    
                    echo "Checking remote image: ${fullImageName}"
                    
                    // Try to pull the image first to see if it exists remotely
                    def pullStatus = sh(script: "docker pull ${fullImageName} || true", returnStdout: true).trim()
                    
                    if (pullStatus.contains("Image is up to date") || pullStatus.contains("Downloaded newer image")) {
                         echo "Image ${fullImageName} exists remotely. Skipping build."
                    } else {
                        echo "Image not found remotely. Building..."
                        sh "docker build -t ${fullImageName} ."
                        sh "docker tag ${fullImageName} ${latestImageName}"
                        
                        echo "Pushing images..."
                        sh "docker push ${fullImageName}"
                        sh "docker push ${latestImageName}"
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                     def gitCommit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                     def fullImageName = "${REGISTRY}/${IMAGE_REPO}:${gitCommit}"
                     
                     // Ensure we have the image locally (in case we skipped build)
                     sh "docker pull ${fullImageName}"

                     sh """
                     docker stop ${CONTAINER_NAME} || true
                     docker rm ${CONTAINER_NAME} || true
                     
                     docker run -d --name ${CONTAINER_NAME} \
                         --restart unless-stopped \
                         -p 5464:5464 \
                         -v /Users/giatran/shortcutmanager-data:/app/data \
                         ${fullImageName}
                     """
                }
            }
        }
    }
}