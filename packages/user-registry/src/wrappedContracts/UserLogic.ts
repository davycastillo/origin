import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { GeneralFunctions, ISpecialTx } from '@energyweb/utils-general';
import { PastEventOptions } from 'web3-eth-contract';
import UserLogicJSON from '../../build/contracts/lightweight/UserLogic.json';

export class UserLogic extends GeneralFunctions {
    web3: Web3;

    constructor(web3: Web3, address?: string) {
        const buildFile = UserLogicJSON;
        const buildFileAbi = buildFile.abi as AbiItem[];

        super(
            address
                ? new web3.eth.Contract(buildFileAbi, address)
                : new web3.eth.Contract(
                      buildFileAbi,
                      (buildFile.networks as any).length > 0 ? (buildFile.networks as any)[0] : null
                  )
        );
        this.web3 = web3;
    }

    async getAllEvents(eventFilter?: PastEventOptions) {
        return this.web3Contract.getPastEvents('allEvents', this.createFilter(eventFilter));
    }

    async initialize(txParams: ISpecialTx) {
        const method = this.web3Contract.methods.initialize();

        return this.send(method, txParams);
    }

    async deactivateUser(_user: string, txParams?: ISpecialTx) {
        const method = this.web3Contract.methods.deactivateUser(_user);

        return this.send(method, txParams);
    }

    async getRolesRights(_user: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getRolesRights(_user).call(txParams);
    }

    async setRoles(_user: string, _rights: number, txParams?: ISpecialTx) {
        const method = this.web3Contract.methods.setRoles(_user, _rights);

        return this.send(method, txParams);
    }

    async createUser(
        _propertiesDocumentHash: string,
        _documentDBURL: string,
        _user: string,
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.createUser(
            _propertiesDocumentHash,
            _documentDBURL,
            _user
        );

        return this.send(method, txParams);
    }

    async updateUser(
        _user: string,
        _propertiesDocumentHash: string,
        _documentDBURL: string,
        txParams?: ISpecialTx
    ) {
        const method = this.web3Contract.methods.updateUser(
            _user,
            _propertiesDocumentHash,
            _documentDBURL
        );

        return this.send(method, txParams);
    }

    async owner(txParams?: ISpecialTx) {
        return this.web3Contract.methods.owner().call(txParams);
    }

    async isRole(_role: number, _caller: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.isRole(_role, _caller).call(txParams);
    }

    async getFullUser(_user: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.getFullUser(_user).call(txParams);
    }

    async doesUserExist(_user: string, txParams?: ISpecialTx) {
        return this.web3Contract.methods.doesUserExist(_user).call(txParams);
    }
}
