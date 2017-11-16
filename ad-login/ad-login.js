const dns = require('dns');
const ldap = require('ldapjs');
const _ = require('lodash');

const serviceName = '_ldap._tcp';

function checkConfiguration() {
  return (typeof process.env.AD_DOMAIN === 'string' &&
     typeof process.env.AD_SEARCHBASE === 'string' &&
     typeof process.env.AD_GROUP === 'string')
}

module.exports = function checkLogin(user, pass, callback) {
  if(!checkConfiguration()) {
    let err = new Error('Missing domain configuration');
    callback(err, null);
    return;
  }
  user = user + '@' + process.env.AD_DOMAIN;
  // find Domain controllers
  dns.resolve(serviceName + '.' + _.trim(process.env.AD_DOMAIN), 'SRV', function(err, addresses) {
    if(err) {
      callback(err, null);
      return;
    }
    let dcFound = false;
    addresses.forEach(function(address) {
      if(dcFound) {
        return;
      }
      let ldapURL = '';
      if(address.port === 636) {
        ldapURL = 'ldaps://' + address.name + ':' + address.port;
      } else {
        ldapURL = 'ldap://' + address.name + ':' + address.port;
      }
      let ldapClient = ldap.createClient({
        url: ldapURL,
        tlsOptions: {
          rejectUnauthorized: false,
          checkServerIdentity: function(servername, cert) {
            return undefined;
          }
        }
      });
      ldapClient.on('error', function(err) {
        if(dcFound) {
          return;
        }
        console.log(err);
        callback(err, null);
      });

      ldapClient.bind(user, pass, function(err) {
        if(dcFound) {
          return;
        }
        if(err) {
          if(dcFound) {
            return;
          }
          if(_.includes(err.lde_message, 'AcceptSecurityContext')) {
            dcFound = true;
            callback(null, false);
            return;
          }
          callback(err, null);
          return;
        }
        dcFound = true;
        checkIfInGroup(ldapClient, user, process.env.AD_GROUP, callback);
        return;
      });
    });
  });
}

function checkIfInGroup(ldapClient, userName, groupName, callback) {
  ldapClient.search(process.env.AD_SEARCHBASE, {
    scope: 'sub',
    filter: '(userPrincipalName=' + userName + ')',
    attributes: [
      'memberOf'
    ]
  }, function(err, res) {
    let found = false;
    res.on('searchEntry', function(entry) {
      let inGroup = false;
      entry.attributes.forEach(function(attr) {
        attr.vals.forEach(function(val) {
          if(val === groupName) {
            inGroup = true;
          }
        });
      });
      found = true;
      callback(null, inGroup);
    });
    res.on('error', function(err) {
      callback(err, null);
      ldapClient.unbind();
    });
    res.on('end', function(result) {
      if(!found) {
        callback(null, false);
      }
      ldapClient.unbind();
    });
  });
}

