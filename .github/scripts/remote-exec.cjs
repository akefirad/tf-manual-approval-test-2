const express = require('express');
const { spawn } = require('child_process');
const ngrok = require('ngrok');
const bodyParser = require('body-parser');
const AnsiToHtml = require('ansi-to-html');

// Initialize ANSI to HTML converter
const ansiConverter = new AnsiToHtml({
    newline: true,
    escapeXML: true,
    fg: '#000',
    bg: '#fff'
});

class CommandInterface {
    constructor(app) {
        this.app = app;
        this.commandOutput = '';
        this.commandProcess = null;
        this.isCommandRunning = false;
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.getHtmlTemplate(this.commandOutput));
        });

        this.app.post('/input', (req, res) => {
            if (!this.isCommandRunning) {
                console.log('Command is not running');
                res.redirect('/');
                return;
            }
            
            const input = req.body.input;
            console.log(`Received input: ${input}`);
            
            if (this.commandProcess?.stdin?.writable) {
                try {
                    this.commandProcess.stdin.write(input + '\n', (error) => {
                        if (error) {
                            console.error('Error writing to stdin:', error);
                            this.commandOutput += `\nError writing to stdin: ${error.message}`;
                        } else {
                            console.log('Successfully wrote to stdin');
                        }
                        // this.commandProcess.stdin.end();
                    });
                } catch (error) {
                    console.error('Exception while writing to stdin:', error);
                    this.commandOutput += `\nException while writing to stdin: ${error.message}`;
                }
            } else {
                console.log('Command process stdin is not writable');
                this.commandOutput += '\nCommand process stdin is not writable';
            }
            res.redirect('/');
        });
    }

    startCommand(command, args) {
        // Configure spawn options for CI environment
        const spawnOptions = {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,  // Use shell to ensure proper stdin handling
            // env: {
            //     ...process.env,
            //     FORCE_COLOR: '1'  // Force color output
            // }
        };

        this.commandProcess = spawn(command, args, spawnOptions);
        this.isCommandRunning = true;

        if (this.commandProcess.stdout) {
            this.commandProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Command output:', output);
                this.commandOutput += output;
            });
        }

        if (this.commandProcess.stderr) {
            this.commandProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error('Command error:', error);
                this.commandOutput += error;
            });
        }

        this.commandProcess.on('error', (error) => {
            console.error('Failed to start command:', error);
            this.commandOutput += `\nFailed to start command: ${error.message}`;
            this.isCommandRunning = false;
        });

        this.commandProcess.on('close', (code) => {
            console.log(`Command process exited with code ${code}`);
            this.commandOutput += `\nProcess exited with code ${code}`;
            this.isCommandRunning = false;
        });
    }

    getHtmlTemplate(output) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Command Interface</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    #output { 
                        background: #f5f5f5; 
                        padding: 10px; 
                        border-radius: 5px;
                        white-space: pre-wrap;
                        margin-bottom: 20px;
                        max-height: 500px;
                        overflow-y: auto;
                        font-family: monospace;
                    }
                    form { margin-top: 20px; }
                    input[type="text"] { 
                        width: 80%; 
                        padding: 8px;
                        margin-right: 10px;
                    }
                    button { 
                        padding: 8px 15px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    button:hover { background: #0056b3; }
                    .hidden { display: none; }
                </style>
            </head>
            <body>
                <h2>Command Output:</h2>
                <div id="output">${ansiConverter.toHtml(output)}</div>
                <form method="POST" action="/input" ${!this.isCommandRunning ? 'class="hidden"' : ''}>
                    <input type="text" name="input" placeholder="Enter input for the command..." required>
                    <button type="submit">Send</button>
                </form>
            </body>
            </html>
        `;
    }
}

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create command interface instance
const commandInterface = new CommandInterface(app);

const startServer = async ({ command, args }) => {
    console.log(`Starting server with command: ${command} and args: ${args}`);
    try {
        // Start the web server
        app.listen(port, () => {
            console.log(`Web server running on port ${port}`);
        });

        // Start ngrok
        // const url = await ngrok.connect({
        //     port,
        //     authtoken: process.env.NGROK_AUTH_TOKEN
        // });
        // console.log(`Ngrok tunnel established at: ${url}`);

        // Start the command if provided
        commandInterface.startCommand(command, args);
        
        console.log('Application is ready!');
    } catch (error) {
        console.error('Error starting the application:', error);
        throw error;
    }
};

module.exports = async ({ input }) => {
    await startServer(input);
}
