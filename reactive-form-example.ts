@Injectable({ providedIn: 'root' })
export class ReactiveFormService {

  private formData: any = {
    accounts: [
      {
        acctNumber: '36474',
        status: 'OPEN',
        longTitle: 'Primary Account',
        shortTitle: 'Primary'
      },
      {
        acctNumber: '98765',
        status: 'CLOSED',
        longTitle: 'Secondary Account',
        shortTitle: 'Secondary'
      }
    ]
  };

  getValue(fieldId: string): any {
    return this.formData[fieldId];
  }
}
