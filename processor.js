const axios = require('axios');
const csv = require('csvtojson');
const fs = require('fs');
const jsonToCSV = require('json-to-csv');

const emailKeys = ['Email', 'Email 1', 'Email 2', 'Email 3', 'Email 4', 'Email 5'];
const phoneKeys = ['Phone 1', 'Phone 2', 'Phone 3', 'Phone 4', 'Phone 5'];

const formatPhoneNumber = phone => {
  let sanitized = phone.replace(/\D/g, '');
  if (sanitized.length === 10) {
    sanitized = `1${sanitized}`;
  }
  if (sanitized.length !== 11) return null;
  return `${sanitized.slice(0, 1)}-${sanitized.slice(1, 4)}-${sanitized.slice(4, 7)}-${sanitized.slice(7)}`;
};

const validateEmail = async (email) => {
  const config = {
    method: 'get',
    url: `https://ws.strikeiron.com/EmailVerify7/EmailVerification/VerifyEmail?LicenseInfo.RegisteredUser.UserID=73CEBE2BAA48610EF74F&VerifyEmail.Email=${email}&format=JSON`,
  };

  const { data} = await axios(config);
  return +data.WebServiceResponse.VerifyEmailResponse.VerifyEmailResult.ServiceStatus.StatusNbr < 300;
}

const validatePhone = async (phone) => {
  const config = {
    method: 'get',
    url: `http://ws.strikeiron.com/StrikeIron/GlobalPhoneVal15/GlobalPhoneValidation15/ValidateNumber?LicenseInfo.RegisteredUser.UserID=73CEBE2BAA48610EF74F&ValidateNumber.PhoneNumber=${phone}&format=JSON`,
  };

  const { data} = await axios(config);
  return +data.WebServiceResponse.ValidateNumberResponse.ValidateNumberResult.ServiceStatus.StatusNbr < 300;
}

const process = async (path) => {
  // Convert CSV to JSON
  let rowIndex = 0;
  const csvData = await csv().fromFile(path);
  for (const row of csvData) {
    console.log(rowIndex);
    for (const emailKey of emailKeys) {
      const email = row[emailKey];
      if (!email) continue;
      try {
        const result = await validateEmail(email);
        if (!result) {
          row[emailKey] = '';
        }
      } catch (e) {
        console.log(rowIndex, emailKey, row[emailKey], e.message);
      }
    }
    for (const phoneKey of phoneKeys) {
      const phone = formatPhoneNumber(row[phoneKey]);
      if (!phone) {
        row[phoneKey] = '';
        continue;
      }
      try {
        const result = await validatePhone(phone);
        if (!result) {
          row[phoneKey] = '';
        }
      } catch (e) {
        console.log(rowIndex, phoneKey, row[phoneKey], e.message);
      }
    }
    rowIndex += 1;
  }

  const outputPath = `${path}-sanitized.csv`;
  await jsonToCSV(csvData, outputPath);
};

const run = async () => {
  let list = JSON.parse(fs.readFileSync('list.json'));
  for (const path of list) {
    try {
      await process(path);
      fs.unlinkSync(path);
      list = list.filter(p => p !== path);
      fs.writeFileSync('list.json', JSON.stringify(list));
    } catch (e) {
      console.log(path, e.message);
    }
  }

  setTimeout(run, 60 * 1000);
};

run();
