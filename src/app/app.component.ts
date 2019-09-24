import { Component, OnInit, ElementRef, ViewChild, ApplicationInitStatus } from '@angular/core';
import uuid from 'uuid';
import { ActionSequence } from 'selenium-webdriver';

declare var PDFTron: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app isolating pdftron issue';

  @ViewChild('webViewer') viewer: ElementRef;
  private myWebViewer: any;
  private pdfDoc: any;
  origGoToTrigger: any;
  origGoToRTrigger: any;
  origUriTrigger: any;

  constructor() { }

  ngOnInit() {
    this.initializeDocument = this.initializeDocument.bind(this);
    this.readFileStream = this.readFileStream.bind(this);

    this.initializePDFWebViewer();
  }
  initializePDFWebViewer() {

    let licenseKey = atob('ZGVtbzprbmd1eWVuNzJAY3NjLmNvbTo3MjVkZjEzZDAxY2NkNzM4ZjRkMGMyNmNlNzk0YTZhMmJhM2JjZDU5N2Q2YmE3NGJjYw==');
    let pdfTronOptions = {
      type: 'html5',
      path: '/assets/lib',
      config: '/assets/config.js',
      css: '/assets/customStyle.css',
      preloadPDFWorker: false,
      enableAnnotations: true,
      fullAPI: true,
      l: licenseKey
    };

    this.myWebViewer = new PDFTron.WebViewer(pdfTronOptions, this.viewer.nativeElement);
    // listen ready event from pdftron lib
    this.viewer.nativeElement.addEventListener('ready', this.readFileStream);
    this.viewer.nativeElement.addEventListener('documentLoaded', this.initializeDocument);
  }

  /**
   * @property Content window of PDFTron WebViewer
   */
  public getWindow(): any {
    return this.viewer.nativeElement.querySelector('iframe').contentWindow;
  }

  /**
   * @property PdfNet instance of current component
   */
  public get getPdfNet(): any {
    let win = this.getWindow();
    return win !== null ? win.PDFNet : null;
  }


  /**
   * @property DocumentViewer instance
   */
  public get docViewer(): any {
    return this.webViewer.docViewer;
  }

  /**
   * @property WebViewer instance
   */
  public get webViewer(): any {
    return this.myWebViewer.getInstance();
  }

  /**
   * @property CoreControls instance of current WebViewer
   */
  public get coreControls(): any {
    return this.getWindow().CoreControls;
  }

  /**
   * Get Annotations namespace
   */
  public get annotations(): any {
    return this.getWindow().Annotations;
  }

  public get actions(): any {
    return this.getWindow().Actions;
  }

  /**
   * Load document based on fileInfo
   */
  readFileStream() {
    this.coreControls.setWorkerPath('/assets/lib/core');
    this.coreControls.enableFullPDF(true);


    const loadOptions = {
      documentId: uuid(),
      filename: 'bookmark.pdf'
    };

    const uri = `https://localhost:44372/api/values/read`;

    this.webViewer.loadDocument(uri, loadOptions);
  }

  async performLinkAction(link): Promise<boolean> {
    const actions = await link.getActions();
    const action = actions.U[0];

    if (await action.isValid()) {
      const actionType = await action.getType();
      console.log(`Action Type: ${actionType}.`);
    }
    return false;
  }

  async triggerDisplayingGoToLink(link) {
    const res = await this.performLinkAction(link);

    if (!res) {
      console.log('Error on displaying GoTo link.')
    }
  }

  async triggerDisplayingGoToRLink(link) {
    const res = await this.performLinkAction(link);

    if (!res) {
      console.log('Error on displaying GoToR link.');
    }
  }

  async triggerDisplayingUriLink(link) {
    const res = await this.performLinkAction(link);

    if (!res) {
      console.log('Error on displaying URI link.');
    }
  }

  /**
   * Initialize Document and virtual content
   */
  private initializeDocument() {
    this.getPdfNet.initialize().then(function() {
      console.log('PDFNetJS has been initialized!');

      this.docViewer.getDocument().getPDFDoc().then(function(doc) {
        this.pdfDoc = doc;

        // TODO: The alternative solution waits 5 seconds for PDFNet lib initializing.
        // The problem is initialize method running asynchronously along with caller thread
        // Therefore, no way to determine whenever it already completed.
        // This issue need to be addressed by PDFTron team.
        setTimeout(async () => {
          doc.initSecurityHandler();

          doc.hasSignatures().then(async signed => {
            console.log(signed);
          });

          this.origGoToTrigger = this.actions.GoTo.prototype.onTriggered;
          this.actions.GoTo.prototype.onTriggered = this.triggerDisplayingGoToLink.bind(this);

          this.origGoToRTrigger = this.actions.GoToR.prototype.onTriggered;
          this.actions.GoToR.prototype.onTriggered = this.triggerDisplayingGoToRLink.bind(this);

          this.origUriTrigger = this.actions.URI.prototype.onTriggered;
          this.actions.URI.prototype.onTriggered = this.triggerDisplayingUriLink.bind(this);
        }, 5000);
      }.bind(this)).catch(err => {
        console.error('Get PdfDoc throws exception', err);
      });
    }.bind(this)).catch(err => {
      console.error('PDFNet initializes throwing exception', err);
    });
  }
}
