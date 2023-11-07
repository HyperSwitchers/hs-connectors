// @ts-check

import _ from 'lodash';

const synonymMapping = {
  card_exp_month: ['expiry_month'],
  card_exp_year: ['expiry_year'],
  card_number: ['number'],
  card_holder_name: ['cardholderName'],
  currency: ['currency'],
  card_cvc: ['cvc'],
  billing_address_firstname: ['first_name', 'username'],
  billing_address_lastname: ['lastname'],
};

function mapFieldNames(input, mapping) {
  if (_.isObject(input)) {
    if (_.isArray(input)) {
      let res = _.map(input, (item) => mapFieldNames(item, mapping));
      return res;
    } else {
      let res = _.mapValues(input, (value, key) => {
        if (_.isObject(value)) {
          return mapFieldNames(value, mapping);
        } else {
          const synonymKey = _.map(mapping, (value, kk) =>
            _.find(value, (synonym) => synonym === key) ? kk : undefined
          ).filter((a) => a);
          return synonymKey[0] ? synonymKey[0] : mapFieldNames(value, mapping);
        }
      });
      return res;
    }
  }
  return input;
}

const FieldsAutocomplete = () => {
  const inputJson = {
    expiry_month: '05',
    expiry_year: '2025',
    cvc: '123',
    first_name: 'John',
    lastname: 'Doe',
    usrname: 'user123',
    nested: {
      cvv: '456',
      usr_name: 'user456',
    },
    amount: 499,
    card: {
      number: '4012000100000007',
      expMonth: '03',
      expYear: '25',
      cvc: '123',
      cardholderName: 'john',
    },
    captured: true,
    currency: 'EUR',
    description: 'asdasd',
  };

  const inputKey = 'expiry_year';
  const outputKey = JSON.stringify(
    mapFieldNames(inputJson, synonymMapping),
    null,
    4
  );

  return (
    <div>
      <h2>Input JSON</h2>
      <pre>{JSON.stringify(inputJson, null, 4)}</pre>
      <h2>Output JSON</h2>
      <pre>
        <code>{outputKey}</code>
      </pre>
    </div>
  );
};

export default FieldsAutocomplete;
