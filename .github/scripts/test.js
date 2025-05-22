const input = { 
    //command: 'script',
    //args: ['-c', '"terraform init && terraform apply"']
    command: 'terraform init && terraform apply'
};
const script = require('./remote-exec.cjs');
script({ input });
