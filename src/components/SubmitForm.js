import React, {Component} from 'react'

var Loader = require('react-loader');


class SubmitForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loadingPrice: false,
      fullName: '',
      title: '',
      text: '',
    };
  }

  componentWillMount() {
    this.loadPrice();
  }

  loadPrice() {
    this.props.hashStoreContractInstance.price().then((result) => {
        this.setState({price: result.toNumber()});
      }
    )
  }

  saveText() {
    let {fullName, title, text} = this.state;
    let data = {fullName, title, text};

    this.setState({savingText: true});
    this.props.ipfs.addJSON(data, (err, hash) => {
      if (err) {
        this.setState({savingText: false});
        return this.props.addNotification(err.message, "error");
      }

      console.log("Saved to IPFS", data);
      console.log("IPFS hash:", hash);

      let event = this.props.hashStoreContractInstance.NewHashStored({_hashSender: this.props.web3.eth.defaultAccount});
      event.watch((error, log) => {
        var hashId = log.args._hashId.toNumber();
        this.setState({savingText: false});
        this.props.onSubmit(hashId);
        this.props.addNotification(`Data saved successfully ! Submission ID: ${hashId}`, "success");
        event.stopWatching();
      });

      this.props.hashStoreContractInstance.save(hash, {value: this.state.price}).catch((err) => {
        this.setState({savingText: false});
        this.props.addNotification(err.message, "error");
        event.stopWatching();
      });

    });

    /* ipfs.catJSON(result, (err, retrieved) => {
       console.log(err, "we found:" + JSON.stringify(retrieved));
     });*/
  }

  updateInputValue(e, field) {
    this.setState({[field]: e.target.value});
  }

  validForm() {
    if (!this.props.hashStoreContractInstance) {
      return false;
    }

    return this.state.fullName && this.state.title && this.state.text;
  }

  render() {
    return (
      <div className="SubmitForm">

        <h5>Submission price: {this.props.web3.fromWei(this.state.price, 'ether')} ETH</h5>

        <form className="pure-form">
          <fieldset className="pure-group">
            <input type="text" className="pure-input-1-2" placeholder="Full Name"
                   value={this.state.fullName} onChange={e => this.updateInputValue(e, 'fullName')}/>
            <input type="text" className="pure-input-1-2" placeholder="Title"
                   value={this.state.title} onChange={e => this.updateInputValue(e, 'title')}/>
            <textarea className="pure-input-1-2" placeholder="Your Text"
                      value={this.state.text} onChange={e => this.updateInputValue(e, 'text')}
            ></textarea>
          </fieldset>

          <Loader loaded={!this.state.loadingWeb3}>
            <button type="button" className="pure-button pure-input-1-2 button-success"
                    disabled={!this.validForm()} onClick={() => this.saveText()}>Save
            </button>
          </Loader>
        </form>
      </div>
    );
  }
}

export default SubmitForm;
