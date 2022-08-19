// for message clearing
let messageswitch = false;
let errorswitch = false;

document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').onsubmit = () => sendmail();

    // By default, load the inbox
    load_mailbox('inbox');
});

// #############################################################################

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    const elem = '#errspan';
    errorswitch = errAndMesCheck(elem, errorswitch);
    const melem = '#messpan';
    messageswitch = errAndMesCheck(melem, messageswitch);
}

// #############################################################################

function sendmail() {

    const data = {
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
        }
    
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            const oldspan = document.querySelector('#errspan');
            if (oldspan) {
                oldspan.remove();
                errorswitch = false;
            }
            const errspan = document.createElement('p');
            errspan.innerHTML = `${result.error}`;
            errspan.setAttribute('id', 'errspan');
            errspan.setAttribute('class', "alert alert-danger");
            document.querySelector('#error').append(errspan);
            compose_email();
        }
        else {
            const messpan = document.createElement('p');
            messpan.innerHTML = `${result.message}`;
            messpan.setAttribute('id', 'messpan');
            messpan.setAttribute('class', 'alert alert-success');
            document.querySelector('#message').append(messpan);
            load_mailbox('sent');
        }
        });
    return false;   
}

// ############################################################################

function load_mailbox(mailbox) {

    const oldgrid = document.querySelector('#mailGrid');
    console.log(1, oldgrid);
    if (oldgrid)
        oldgrid.remove();
    const clear = document.querySelector('#mailGrid');
    console.log(2, clear);
    
    // for display the message once
    const elem = '#messpan';
    messageswitch = errAndMesCheck(elem, messageswitch);

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
    fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
        console.log(3, emails);
        const maingrid = document.createElement('div');
        maingrid.setAttribute('id', 'mailGrid'); 

        emails.forEach(email => {
            const grid_line = document.createElement('div');
            const recipientSender_field = document.createElement('span');
            const subject_field = document.createElement('span');
            const timestamp_field = document.createElement('span');
            const archivebutton = document.createElement('button');

            subject_field.innerHTML = `${email.subject}`;
            timestamp_field.innerHTML = `${email.timestamp}`;

            timestamp_field.setAttribute('class', 'stamp');

            if (mailbox == 'sent') {
                grid_line.setAttribute('class', 'mailUnit');
                recipients = separatingRecipients(email.recipients);
                recipientSender_field.innerHTML = `To: ${recipients}`;
            } 
            else {
                recipientSender_field.innerHTML = `From: ${email.sender}`;
                if (email.read == true)
                    grid_line.setAttribute('class', 'mailUnit4 readMessage');
                else
                    grid_line.setAttribute('class', 'mailUnit4 unreadMessage');
                
                if (mailbox == 'inbox')
                    archivebutton.innerText = 'Archive';
                else
                    archivebutton.innerText = 'Unzip';

                archivebutton.className = 'arcButton btn-outline-primary';
            }

            grid_line.append(recipientSender_field, subject_field, timestamp_field);
            if (mailbox != 'sent')
                grid_line.append(archivebutton);

            maingrid.append(grid_line);

            grid_line.addEventListener('click', (event) => load_email(event, email.id, email.archived, archivebutton, mailbox));    

        });
        console.log(4, maingrid);
       
        document.querySelector('#emails-view').append(maingrid);
    });
}

// #############################################################################

function load_email(event, idOfEmail, arcStatus, archivebutton, mailbox) {
    
    if (event.target === archivebutton)
        archive_email(idOfEmail, arcStatus);
    else {
        const oldmes = document.querySelector('#messpan');
        if (oldmes)
            oldmes.remove();
        const deleteH3 = document.querySelector('h3');
        if (deleteH3)
            deleteH3.remove();
        const deleteMainGrid = document.querySelector('#mailGrid');
        if (deleteMainGrid)
            deleteMainGrid.remove();
        
        fetch('/emails/' + idOfEmail)
        .then(response => response.json())
        .then(email => {
            const divForMail = document.createElement('div');
            const sender_field = document.createElement('p');
            const recipients_field = document.createElement('p');
            const subject_field = document.createElement('p');
            const timestamp_field = document.createElement('p');
            const body_field = document.createElement('p');
            
            // for recipients' separating
            recipients = separatingRecipients(email.recipients)
            
            sender_field.innerHTML = `<strong>From:</strong> ${email.sender}`;
            recipients_field.innerHTML = `<strong>To:</strong> ${recipients}`;
            subject_field.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
            timestamp_field.innerHTML = `<strong>Date:</strong> ${email.timestamp}`;

            const array = email.body.split("\n");
            let body = '';
            for (let unit of array) {
                body += unit + '<br>'
            }
            body_field.innerHTML = body;

            divForMail.setAttribute('id', 'divForMail');

            divForMail.append(sender_field, recipients_field, subject_field, timestamp_field, body_field);

            if (mailbox != 'sent') {
                const reply_button = document.createElement('button');
                reply_button.innerText = 'Reply';
                reply_button.className = 'btn btn-outline-primary';

                divForMail.append(reply_button);
                reply_button.addEventListener('click', () => reply_email(email));
            }

            document.querySelector('#emails-view').append(divForMail);

            if (email.read == false) {
                const data = {
                    read: true
                };
                fetch('/emails/'+ idOfEmail, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                    });
            }
        })
    }
}

// #############################################################################

function archive_email(idOfEmail, arcStatus) {
    
    let status = false;
    if (arcStatus == false)
        status = true;
    
    const data = {
        archived: (status)
    };

    fetch('/emails/'+ idOfEmail, {
        method: 'PUT',
        body: JSON.stringify(data)
        });
    
    console.log(55, idOfEmail);
    load_mailbox('inbox');
}

// #############################################################################

function reply_email (email) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    document.querySelector('#compose-recipients').value = email.sender;

    if (email.subject.slice(0,4) == 'Re: ') 
        document.querySelector('#compose-subject').value = email.subject;
    else 
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
    
    document.querySelector('#compose-body').value = `\n--------------------------------\n On ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}

// #############################################################################
// technical functions
// -----------------------------------------------------------------------

// for display the message or error once
function errAndMesCheck (element, myswitch) {
    const message = document.querySelector(element);
    if (message) {
        if (myswitch == false) {
            myswitch = true
        }
        else {
            myswitch = false;
            document.getElementById(element.slice(1)).remove();
        }
    }
    return myswitch;
}

// #############################################################################

// for recipients' separating
function separatingRecipients(list) {
    let comma = '';
    let recipients = '';
    for (let unit of list) {
        recipients += `${comma}${unit}`;
        comma = ', '
    }
    return recipients
}

// #############################################################################

