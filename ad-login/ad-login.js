const dns = require('dns');
const ldap = require('ldapjs');
const _ = require('lodash');

const serviceName = '_ldap._tcp';

function checkConfiguration() {
  return (typeof process.env.AD_DOMAIN === 'string' &&
     typeof process.env.AD_SEARCHBASE === 'string' &&
     typeof process.env.AD_GROUP === 'string')
}

function buildLdapClient(address) {
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
  return ldapClient;
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
    let calledBack = false;
    let errorCount = 0;
    addresses.forEach(function(address) {
      if(dcFound || calledBack) {
        return;
      }
      let ldapClient = buildLdapClient(address);
      ldapClient.on('error', function(err) {
        errorCount++;
        if(dcFound || calledBack) {
          return;
        }
        console.log('ldapClient on error: ' + err);
        if(errorCount === addresses.length) {
          callback(err, null);
          calledBack = true;
        }
      });

      ldapClient.bind(user, pass, function(err) {
        if(dcFound || calledBack) {
          return;
        }
        if(err) {
          if(dcFound || calledBack) {
            return;
          }
          if(_.includes(err.lde_message, 'AcceptSecurityContext')) {
            dcFound = true;
            callback(null, false);
            calledBack = true;
            return;
          }
          errorCount++;
          if(errorCount === addresses.length) {
            callback(err, null);
            calledBack = true;
          }
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
    let calledBack = false;
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
      if(!calledBack) {
        callback(null, inGroup);
      }
      calledBack = true;
    });
    res.on('error', function(err) {
      if(!calledBack) {
        callback(err, null);
        calledBack = true;
      }
      ldapClient.unbind();
    });
    res.on('end', function(result) {
      if(!found && !calledBack) {
        callback(null, false);
        calledBack = true;
      }
      ldapClient.unbind();
    });
  });
}

