import { assert } from 'chai';
import 'mocha';
import Web3 from 'web3';
import dotenv from 'dotenv';

import { migrateUserRegistryContracts } from '../utils/migrateContracts';
import { UserLogic } from '../wrappedContracts/UserLogic';
import { Role, buildRights } from '../wrappedContracts/RoleManagement';

describe('UserLogic', () => {
    dotenv.config({
        path: '.env.test'
    });

    const web3: Web3 = new Web3(process.env.WEB3);
    const deployKey: string = process.env.DEPLOY_KEY;

    const privateKeyDeployment = deployKey.startsWith('0x') ? deployKey : `0x${deployKey}`;

    let userLogic: UserLogic;

    const accountDeployment = web3.eth.accounts.privateKeyToAccount(privateKeyDeployment).address;

    it('should deploy the contracts', async () => {
        userLogic = await migrateUserRegistryContracts(web3, privateKeyDeployment);

        assert.exists(userLogic);
    });

    it('should give the UserAdmin rights to the deployer account', async () => {
        assert.equal(await userLogic.getRolesRights(accountDeployment), 1);

        assert.equal(await userLogic.isRole(Role.UserAdmin, accountDeployment), true);
        assert.equal(await userLogic.isRole(Role.DeviceAdmin, accountDeployment), false);
        assert.equal(await userLogic.isRole(Role.DeviceManager, accountDeployment), false);
        assert.equal(await userLogic.isRole(Role.Matcher, accountDeployment), false);
        assert.equal(await userLogic.isRole(Role.Trader, accountDeployment), false);
    });

    it('should return 0 rights for random accounts', async () => {
        assert.equal(
            await userLogic.getRolesRights('0x1000000000000000000000000000000000000005'),
            0
        );
    });

    it('should return false when asking for a non-exising user', async () => {
        assert.isFalse(await userLogic.doesUserExist('0x1000000000000000000000000000000000000005'));
    });

    it('should return empty values for a non existing user', async () => {
        assert.deepEqual(
            await userLogic.getFullUser('0x1000000000000000000000000000000000000005'),
            {
                0: '',
                1: '',
                2: '0',
                3: false,
                _documentDBURL: '',
                _propertiesDocumentHash: '',
                _roles: '0',
                _active: false
            }
        );
    });

    it('should fail when trying to set roles for a non-existing user', async () => {
        let failed = false;
        try {
            await userLogic.setRoles('0x1000000000000000000000000000000000000005', 1, {
                privateKey: privateKeyDeployment
            });
        } catch (ex) {
            assert.include(ex.message, 'User does not exist');
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should return correct values for an existing user', async () => {
        await userLogic.createUser(
            'propertiesDocumentHash',
            'documentDBURL',
            '0x1000000000000000000000000000000000000005',
            {
                privateKey: privateKeyDeployment
            }
        );

        assert.deepEqual(
            await userLogic.getFullUser('0x1000000000000000000000000000000000000005'),
            {
                0: 'propertiesDocumentHash',
                1: 'documentDBURL',
                2: '0',
                3: true,
                _propertiesDocumentHash: 'propertiesDocumentHash',
                _documentDBURL: 'documentDBURL',
                _roles: '0',
                _active: true
            }
        );
    });

    it('should fail trying to set roles as non user-Admin', async () => {
        let failed = false;
        try {
            await userLogic.setRoles('0x1000000000000000000000000000000000000005', 1, {
                privateKey: '0x191c4b074672d9eda0ce576cfac79e44e320ffef5e3aadd55e000de57341d36c'
            });
        } catch (ex) {
            failed = true;
            assert.include(ex.message, 'user does not have the required role');
        }
        assert.isTrue(failed);
    });

    it('should set roles as non user-Admin', async () => {
        await userLogic.setRoles('0x1000000000000000000000000000000000000005', 1, {
            privateKey: privateKeyDeployment
        });

        assert.equal(
            await userLogic.getRolesRights('0x1000000000000000000000000000000000000005'),
            1
        );
        assert.deepEqual(
            await userLogic.getFullUser('0x1000000000000000000000000000000000000005'),
            {
                0: 'propertiesDocumentHash',
                1: 'documentDBURL',
                2: '1',
                3: true,
                _propertiesDocumentHash: 'propertiesDocumentHash',
                _documentDBURL: 'documentDBURL',
                _roles: '1',
                _active: true
            }
        );
    });

    it('should return true when asking for an exising user', async () => {
        assert.isTrue(await userLogic.doesUserExist('0x1000000000000000000000000000000000000005'));
    });

    it('should fail when trying to deactive an active admin-account', async () => {
        let failed = false;
        try {
            await userLogic.deactivateUser('0x1000000000000000000000000000000000000005', {
                privateKey: privateKeyDeployment
            });
        } catch (ex) {
            failed = true;
        }
        assert.isTrue(failed);
    });

    it('should deactive user when he is not an admin anymore', async () => {
        await userLogic.setRoles('0x1000000000000000000000000000000000000005', 48, {
            privateKey: privateKeyDeployment
        });
        await userLogic.deactivateUser('0x1000000000000000000000000000000000000005', {
            privateKey: privateKeyDeployment
        });
        assert.isFalse(await userLogic.doesUserExist('0x1000000000000000000000000000000000000005'));
    });

    it('should correctly grant DeviceManager and Trader roles when mixed together as rights', async () => {
        const TEST_ACCOUNT = '0x1000000000000000000000000000000000000006';

        const rights = buildRights([Role.DeviceManager, Role.Trader]);

        await userLogic.createUser('propertiesDocumentHash', 'documentDBURL', TEST_ACCOUNT, {
            privateKey: privateKeyDeployment
        });

        await userLogic.setRoles(TEST_ACCOUNT, rights, {
            privateKey: privateKeyDeployment
        });

        assert.equal(await userLogic.getRolesRights(TEST_ACCOUNT), rights);

        assert.equal(await userLogic.isRole(Role.UserAdmin, TEST_ACCOUNT), false);
        assert.equal(await userLogic.isRole(Role.DeviceAdmin, TEST_ACCOUNT), false);
        assert.equal(await userLogic.isRole(Role.DeviceManager, TEST_ACCOUNT), true);
        assert.equal(await userLogic.isRole(Role.Matcher, TEST_ACCOUNT), false);
        assert.equal(await userLogic.isRole(Role.Trader, TEST_ACCOUNT), true);
    });
});
