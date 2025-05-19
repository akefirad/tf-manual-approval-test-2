const input = { 
    command: 'terraform',
    args: ['-chdir=cdktf.out/stacks/tf-manual-approval-test', 'apply']
};
const script = require('./remote-exec.cjs');
script({ input });
