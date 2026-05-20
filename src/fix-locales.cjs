const fs = require('fs');

const idFile = './src/locales/id.json';
const enFile = './src/locales/en.json';

const idExt = {
  fitness: {
    minutes: "Menit"
  },
  common: {
    success: "Berhasil!",
    signIn: "Masuk",
    signUp: "Daftar",
    password: "Kata Sandi",
    orContinueWith: "Atau lanjutkan dengan"
  }
};

const enExt = {
  fitness: {
    minutes: "Minutes"
  },
  common: {
    success: "Success!",
    signIn: "Sign In",
    signUp: "Sign Up",
    password: "Password",
    orContinueWith: "Or continue with"
  }
};

function update(file, ext) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key in ext) {
    if (!data[key]) data[key] = {};
    for (const sub in ext[key]) {
      data[key][sub] = ext[key][sub];
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

update(idFile, idExt);
update(enFile, enExt);
