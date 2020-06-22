const builder = require('electron-builder');

builder.build({
    config: {
        'appId': 'net.osscat.easydocker',
        'win':{
            'target': {
                'target': 'msi',
                'arch': [
                    'x64'
                    //'ia32',
                ]
            },
            'icon': 'icon/easydocker.ico'
        }
    }
});