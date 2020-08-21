.. _header-n0:

bcbWeb
======

This module provides web API of BCB Wallet Extension。

.. _header-n3:

Types
-----

.. _header-n4:

Account
~~~~~~~

======== ====== ======= ===============
Property Type   Default Description
======== ====== ======= ===============
name     string null    Account name
address  string null    Account address
======== ====== ======= ===============

.. _header-n21:

Chain
~~~~~

======== ====== ======= ===========
Property Type   Default Description
======== ====== ======= ===========
network  string null    Network
chain    string null    Chain
======== ====== ======= ===========

.. _header-n38:

ContractCall
~~~~~~~~~~~~

======== ========= ======== ======== ================
Property Type      Required default  Description
======== ========= ======== ======== ================
type     string    no       standard Contract type
contract string    yes               Contract address
method   string    no                Method prototype
params   object [] yes               Params
======== ========= ======== ======== ================

*If it is a new contract, ``method`` shall not be provided. In this case
the transaction is to publish the contract.*

-  **type**

======== ========================
type    
======== ========================
standard Standard golang contract
bvm      BVM solidity contract
======== ========================

-  **method**

   -  standard method prototype

   .. code:: 

      func FuncName(paramName paramType...)

   Golang syntax. ``func`` and ``paramName`` is optional.

   Examples

   .. code:: 

      func Transfer(to types.Address, value bn.Number)

      Transfer(to types.Address, value bn.Number)

      Transfer(types.Address,bn.Number)

   All of these will be converted to
   ``Transfer(types.Address,bn.Number)`` internally to compute function
   signature.

   -  bvm method prototype

   Same as Ethereum solidity.

-  **params**

.. code:: 

   [ args... ]

Argument list.

Param encoding

============= ====== ====================================================================
Param Type    JSON   Example
============= ====== ====================================================================
string        string "bcbwallet"
[]byte        string "bcbwallet"
types.Address string "bcbtest9agiEGfqASERLuGv9Ytqn5XhfiEP3Zzsu"
types.Pubkey  string "0xdc6b51f210b4016bb18001c06b5202cddf675ffa00ff5b3ca114c7e060578ee0"
types.Number  string "1000", "1000000000000000.123"
int/uint      string "1000"
bool          string "true", "false"
[]            []     []string: ["a", "b", "c"], []int: ["1", "2", "3"]
============= ====== ====================================================================

.. _header-n141:

Transaction
~~~~~~~~~~~

======== ================================= ======== ===================== ==================================================================
Property Type                              Required default               Description
======== ================================= ======== ===================== ==================================================================
network  string                            no       selectedChain.network Network
chain    string                            no       selectedChain.chain   Chain
version  number                            no       2                     Transaction format version
nonce    string                            no                             Nonce, if not provided, query from network
note     string                            no       ""                    Trasaction note, this will be packed to transaction
gasLimit string                            yes                            Limitation of gas used
calls    `ContractCall <#header-n38>`__ [] yes                            Contract call struct. Temporarily at most 2 calls per transaction.
======== ================================= ======== ===================== ==================================================================

.. _header-n191:

Properties
----------

.. _header-n192:

version
~~~~~~~

string ``window.bcbWeb.version``

.. code:: javascript

   "2.8.0" // Three digits x.x.x

.. _header-n195:

language
~~~~~~~~

string ``window.bcbWeb.language``

.. code:: javascript

   "en-US" // User set locale.

.. _header-n198:

ready
~~~~~

boolean ``window.bcbWeb.ready``

.. code:: javascript

   true  // User logged in.
   false // User hasn't logged in or hasn't created an account.

.. _header-n201:

selectedAccount
~~~~~~~~~~~~~~~

`Account <#header-n4>`__ ``window.bcbWeb.selectedAccount``

.. code:: javascript

   {
       name: "account01",
       address: "bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q",
   }

.. _header-n204:

selectedChain
~~~~~~~~~~~~~

`Chain <#header-n21>`__ ``window.bcbWeb.selectedChain``

.. code:: javascript

   { network: "bcb", chain: "bcb" }

.. _header-n207:

Methods
-------

Event listeners must provide a callback.

Other methods may or may not pass a callback. I no callback is provided,
a Promise will be returned.

A callback should have a signature of ``callback(err, result) { }``.

Take ``getBalance`` as an example:

-  Callback

.. code:: javascript

   function cb(err, result) {
       if (err) console.error(err);
       console.log(result);
   }
   window.bcbWeb.getBalance(tokenAddress, cb)

-  No callback (Promise)

.. code:: javascript

   // no callback, a promise is returned
   let balancePromise = window.bcbWeb.getBalance(tokenAddress)
   balancePromise.then(balance => {
       console.log(balance);
   }).catch(err => {
       console.error(err);
   })

.. _header-n220:

onStateChanged
~~~~~~~~~~~~~~

Listener of global wallet state.

**Conditions**

None

**Syntax**

.. code:: javascript

   window.bcbWeb.onStateChanged(function callback)

**Parameters**

``callback``

function. Parameters:

-  ``ready``

   boolean. Same as `ready <#header-n198>`__.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.onStateChanged(ready => {
       if (ready) {
           console.log('User has logged in.');
       } else {
           console.log('User hasn't logged in or hasn't created an account.');
       }
   })

.. _header-n237:

onAccountChanged
~~~~~~~~~~~~~~~~

Listener of current account.

**Conditions**

None.

**Syntax**

.. code:: javascript

   window.bcbWeb.onAccountChanged(function callback)

**Parameters**

``callback``

function. Parameters:

-  ``account``

   `Account <#header-n4>`__.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.onAccountChanged(account => {
       if (account.address) {
           // User logged in.
           console.log(account);
           // {
           //   name: 'acount01',
           //   address: 'bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q',
           // }
       } else {
           // User logged out.
           console.log(account);
           // {
           //   name: null,
           //   address: null
           // }
       }
   })

.. _header-n254:

onChainChanged
~~~~~~~~~~~~~~

Listener of current chain selection.

**Conditions**

None.

**Syntax**

.. code:: javascript

   window.bcbWeb.onChainChanged(function callback)

**Parameters**

``callback``

function. Parameters:

-  ``chain``

   `Chain <#header-n21>`__.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.onChainChanged(chain => {
       console.log(chain);
       // { network: 'bcb', chain: 'bcb' }
   })

.. _header-n271:

requestLogin
~~~~~~~~~~~~

Request user to log in. A window will pop up, depends on the current
wallet state.

**Conditions**

None.

**Syntax**

.. code:: javascript

   window.bcbWeb.requestLogin(function callback)

**Parameters**

``callback`` \| Optional

function. Parameters:

-  ``result``

   boolean.

   If request is successfully processed, ``true`` is returned, a login
   window will pop up. This can't be used for login checking.

   If an error has occured, returns ``false``.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.requestLogin().then(result => {
       console.log(result);
   }).catch(err => {
       console.error(err);
   })

Poll `selectedAccount <#header-n201>`__ or register
`onAccountChanged <#header-n237>`__ listener to get current account.

.. _header-n291:

getBalance
~~~~~~~~~~

Get balance of current account.

**Conditions**

User has logged in.

**Syntax**

.. code:: 

   getBalance(string tokenAddress, function callback)

**Parameters**

``tokenAddress`` \| Optional

string. Token address. If not provided, use current selected token.

``callback`` \| Optional

function. Parameters:

-  ``balance``

   number. Account balance.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.getBalance().then(balance => {
       console.log(balance);
   }).catch(err => {
       console.error(err);
   })

   window.bcbWeb.getBalance('bcbCsRXXMGkUJ8wRnrBUD7mQsMST4d53JRKJ').then(balance => {
       console.log(balance);
   }).catch(err => {
       console.error(err);
   })

.. _header-n310:

getBalanceBySymbol
~~~~~~~~~~~~~~~~~~

Get balance of current account.

**Conditions**

User has logged in.

**Syntax**

.. code:: 

   getBalanceBySymbol(string tokenSymbol, function callback)

**Parameters**

``tokenSymbol``

string. Token symbol, case insensitive.

``callback`` \| Optional

function. Parameters:

-  ``balance``

   number. Account balance.

**Return value**

None.

**Examples**

.. code:: javascript

   // tokenSymbol insensitive
   window.bcbWeb.getBalanceBySymbol('DC').then(balance => {
       console.log(balance);
   }).catch(err => {
       console.error(err);
   })

.. _header-n329:

signMessage
~~~~~~~~~~~

Sign a message.

**Conditions**

User has logged in.

**Syntax**

.. code:: javascript

   signMessage(string message, function callback)

**Parameters**

``message``

string. hex encoding.

``callback`` \| Optional

function. Parameters:

-  ``result``

   object. Definition:

========= ======== ========================
Property  Type     Description
========= ======== ========================
signature *string* signature, hex encoding
pubkey    *string* public key, hex encoding
========= ======== ========================

**Return value**

None.

**Examples**

.. code:: javascript

   let message = '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0';
   window.bcbWeb.signMessage(message).then(result => {
       let {
           signature,
           pubkey
       } = result;
       // hex
       console.log('signature: ', signature);
       // hex
       console.log('pubkey: ', pubkey);
   }).catch(err => {
       console.error(err);
   })

.. _header-n361:

signTransaction
~~~~~~~~~~~~~~~

Build transaction and sign.

**Parameters**

User has logged in.

**Syntax**

.. code:: javascript

   signTransaction(Transaction transaction, function callback)

**Parameters**

``transaction``

`Transaction <#header-n141>`__.

``callback`` \| Optional

function. Parameters:

-  ``signedTransaction``

   string. Signed transaction, which can be broadcast to network.

**Return value**

None.

**Examples**

.. code:: javascript

   let transaction = {
       // Optional, defaults to selectedChain.network
       "network": "bcb",
       // Optional, defaults to selectedChain.chain
       "chain": "bcb",
       // Optional, defaults to 2
       "version": 2,
       // Optional, if not provided, query from network
       "nonce": "100",
       // Optional
       "note": "2transfers",
       "gasLimit": "25000",
       "calls": [{
           "type": "standard",
           "contract": "bcbLVgb3odTfKC9Y9GeFnNWL9wmR4pwWiqwe",
           "method": "func Transfer(to types.Address, value bn.Number)",
           "params": ["bcbJjYFgmG52r2vnVcaSoBKKoUTxmMedjm8p", "1000000"]
       },
       {
           // type defaults to standard
           "contract": "bcbCsRXXMGkUJ8wRnrBUD7mQsMST4d53JRKJ",
           "method": "func Transfer(to types.Address, value bn.Number)",
           "params": ["bcbJjYFgmG52r2vnVcaSoBKKoUTxmMedjm8p", "2000000"]
       }]
   };

   window.bcbWeb.signTransaction(transaction).then(signedTransaction => {
       console.log(signedTransaction);
   }).catch(err => {
       console.error(err);
   })

**BVM Examples**

.. code:: javascript

   let transaction = {
       // "network": "bcb",
       // "chain": "bcb",
       // "version": 2,
       // "nonce": "100",
       "note": "bvmcall",
       "gasLimit": "25000",
       "calls": [{
           "type": "bvm",
           "contract": "bcbLVgb3odTfKC9Y9GeFnNWL9wmR4pwWiqwe",
           "method": "function Buy(uint code) external payable",
           "params": ["1"]
       }]
   };

   window.bcbWeb.signTransaction(transaction).then(signedTransaction => {
       console.log(signedTransaction);
   }).catch(err => {
       console.error(err);
   })

.. _header-n382:

broadcastTransaction
~~~~~~~~~~~~~~~~~~~~

Broadcast transaction.

**Parameters**

User has logged in.

**Syntax**

.. code:: javascript

   broadcastTransaction(string signedTransaction, function callback)

**Parameters**

``signedTransaction``

string. Signed transaction, result of
`signTransaction <#header-n361>`__.

``callback`` \| Optional

function. Parameters:

-  ``txHash``

   string. Transaction hash, hex encoded.

**Return value**

None.

**Examples**

.. code:: javascript

   let signedTransaction = 'bcb<tx>.v2.4F4nkxf7JXt14HXUQiUsBxpdYMR2bAdi1bwhMB97XSL2Dsr9hDsisc1uFiuYHperHB9ktxDfub4NuYFshYXXUq7jfbQGfgzmvVsVq1yhJf5F9vWJRQRh4ne5hC4oyJ4CtNybsyBZoNab.<1>.YTgiA1gdDGi2L8hzmyRJRxF9nYkA5bFvdZ5AUTvAbUQRMY7bJnezcfkLoCmzt6RPN2vLtWG3VUrrJJ6TtVVZhXPXrRsU3tssghQAuDnBfnerKp7y3koCnshhL5AWQZj6qrZTb2XJVV6NNJ6XtE8QU';

   window.bcbWeb.broadTransaction(signedTransaction).then(txHash => {
       console.log(txHash);
   }).catch(err => {
       console.error(err);
   })

**Notes**

-  The node to broadcast transaction is
   `selectedChain <#header-n204>`__.

-  If ``selectedChain`` is changed after ``signTransaction``,
   transaction will be rejected by network.

.. _header-n407:

transferToken
~~~~~~~~~~~~~

Transfer token.

**Parameters**

User has logged in.

**Syntax**

.. code:: javascript

   transferToken(string token, string to, string | number value, string note, function callback)

**Parameters**

``token``

string. Token symbol.

``to``

string. Receipient address.

``value``

string \| number. Amount to transfer.

``note``

string. Transaction note.

``callback`` \| Optional

function. Parameters:

-  ``txHash``

   string. Transaction hash, hex encoded.

**Return value**

None.

**Examples**

.. code:: javascript

   window.bcbWeb.transferToken('BCB', 'bcbJjYFgmG52r2vnVcaSoBKKoUTxmMedjm8p ', 1.0, 'random drop').then(txHash => {
       console.log(txHash);
   }).catch(err => {
       console.error(err);
   })

.. _header-n432:

sendTransaction
~~~~~~~~~~~~~~~

Build, sign and broadcast transaction.

Same as `signTransaction <#header-n361>`__ and then
`broadcastTransaction <#header-n382>`__\ 。

**Parameters**

User has logged in.

**Syntax**

.. code:: javascript

   sendTransaction(Transaction transaction, function callback)

**Parameters**

``transaction``

`Transaction <#header-n141>`__.

``callback`` \| Optional

function. Parameters:

-  ``txHash``

   string. Transaction hash, hex encoded.

**Return value**

None.

**Examples**

See `signTransaction <#header-n361>`__ for all transaction properties.

.. code:: javascript

   let transaction = {
       "note": "send",
       "gasLimit": "25000",
       "calls": [{
           "type": "standard",
           "contract": "bcbLVgb3odTfKC9Y9GeFnNWL9wmR4pwWiqwe",
           "method": "Transfer(types.Address,bn.Number)",
           "params": ["bcbJjYFgmG52r2vnVcaSoBKKoUTxmMedjm8p", "1000000"]
       }]
   };

   window.bcbWeb.sendTransaction(transaction).then(txHash => {
       console.log(txHash);
   }).catch(err => {
       console.error(err);
   })

.. _header-n453:

bcbWeb.utils
------------

.. _header-n454:

ethToBcbAddress
~~~~~~~~~~~~~~~

**Parameters**

None.

**Syntax**

.. code:: javascript

   ethToBcbAddress(string ethAddress, Chain chainOpts)

**Parameters**

``ethAddress``

string. Ethereum address.

``chainOpts`` \| Optional

`Chain <#header-n21>`__. Chain options, defaults to
`selectedChain <#header-n204>`__.

**Return value**

BCB address.

**Examples**

.. code:: javascript

   let address =
     window.bcbWeb.utils.ethToBcbAddress("0xec21c4c98e76cd193f8dae1c2983d3697544d01e")
   console.log(address)
   // "bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q"

   window.bcbWeb.utils.ethToBcbAddress("0xec21c4c98e76cd193f8dae1c2983d3697544d01e", {network: 'bcb'})
   // "bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q"

   window.bcbWeb.utils.ethToBcbAddress("0xec21c4c98e76cd193f8dae1c2983d3697544d01e", {network: 'bcb', chain: 'xx'})
   // "bcb[xx]NXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q"

.. _header-n468:

bcbToEthAddress
~~~~~~~~~~~~~~~

**Parameters**

None.

**Syntax**

.. code:: javascript

   bcbToEthAddress(string address, Chain chainOpts)

**Parameters**

``address``

string. BCB address.

``chainOpts`` \| Optional

`Chain <#header-n21>`__. Chain options, defaults to
`selectedChain <#header-n204>`__.

**Return value**

Ethereum address.

**Examples**

.. code:: javascript

   let ethAddress =
     window.bcbWeb.utils.bcbToEthAddress("bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q");
   console.log(ethAddress)
   // "0xec21c4c98e76cd193f8dae1c2983d3697544d01e"

   window.bcbWeb.utils.bcbToEthAddress("bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q", {network: 'bcb', chain: 'bcb'})
   // "0xec21c4c98e76cd193f8dae1c2983d3697544d01e"

   window.bcbWeb.utils.bcbToEthAddress("bcbNXYvZczb7Z1EKTEBPu9Qfyk3dfL1FrH9q", {network: 'bcb', chain: 'xx'})
   // Error: Chain id mismatch
