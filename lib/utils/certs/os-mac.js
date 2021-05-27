const spawn = require('../spawn');
const { execute } = require('./shared');
const generator = require('./generator');

async function trust() {
  await execute('trust', 'OS', async () => {
    await spawn(
      `sudo`,
      `security`,
      `add-trusted-cert`,
      `-d`,
      `-r`,
      `trustRoot`,
      `-k`,
      `/Library/Keychains/System.keychain`,
      generator.getCertAuthPath()
    );
  });
}

async function untrust() {
  await execute('untrust', 'OS', async () => {
    await spawn(
      `sudo`,
      `security`,
      `delete-certificate`,
      `-c`,
      generator.getCertAuthCommonName()
    );
    await spawn(
      `sudo`,
      `security`,
      `delete-certificate`,
      `-c`,
      generator.getCertCommonName()
    );
  });
}

module.exports = {
  trust,
  untrust
};
