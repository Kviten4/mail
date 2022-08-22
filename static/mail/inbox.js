// for message clearing
let messageswitch = false;
let errorswitch = false;

document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').onsubmit = () => sendmail();

    document.querySelectorAll('.disable').forEach(button => {
        button.onclick = () => {
            button.disabled = true;
        }
    });

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

    document.querySelectorAll('.highlight').forEach(button => {
        button.removeAttribute('style');
    });

    const overbutton = document.querySelector('#compose');
    overbutton.style.color = '#fff';
    overbutton.style.backgroundColor = '#007bff';
    overbutton.style.borderColor = '#007bff';
    overbutton.style.boxShadow = '0 0 0 0.2rem rgb(0 123 255 / 50%)';

    // Switch message status
    checkError();
    checkMessage();      

    document.querySelector('.submitdisable').disabled = false;    
}

// #############################################################################

function sendmail() {
    
    document.querySelector('.submitdisable').disabled = true;

    checkError();

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

    document.querySelectorAll('.highlight').forEach(button => {
        button.removeAttribute('style');
    });
    
    const doubleTrick = '#' + mailbox;

    removeOld('#mailGrid');
    removeOld('#divForMail');
    
    checkMessage();

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    // Show the mailbox name
    // document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
    fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {

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
            
            grid_line.addEventListener('click', (event) => 
                load_email(event, email.id, email.archived, archivebutton, mailbox)
            );

        });
        
        document.querySelector('#emails-view').append(maingrid);
        
        const overbutton = document.querySelector(doubleTrick);
        overbutton.disabled = false;
        overbutton.style.color = '#fff';
        overbutton.style.backgroundColor = '#007bff';
        overbutton.style.borderColor = '#007bff';
        overbutton.style.boxShadow = '0 0 0 0.2rem rgb(0 123 255 / 50%)';

        document.querySelectorAll('.arcButton').forEach(button => {
            button.onclick = () => {
                button.disabled = true;
            }
        });

    });
}

// #############################################################################

function load_email(event, idOfEmail, arcStatus, archivebutton, mailbox) {
    
    if (event.target === archivebutton) {       
        archive_email(idOfEmail, arcStatus, mailbox);
    }
    else {
        checkMessage();

        removeOld('h3');
        removeOld('#mailGrid');
        removeOld('#divForMail');
        
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
                reply_button.className = 'btn btn-outline-primary replydisable';

                divForMail.append(reply_button);
                reply_button.addEventListener('click', () => reply_email(email));
            }

            document.querySelector('#emails-view').append(divForMail);

            readStatus(email.read, idOfEmail);
        })
    }
}

// #############################################################################

function archive_email(idOfEmail, arcStatus, mailbox) {
    
    let status = false;
    if (arcStatus == false)
        status = true;
    
    const data = {
        archived: (status)
    };

    fetch('/emails/'+ idOfEmail, {
        method: 'PUT',
        body: JSON.stringify(data)
        })
    .then(() => {
        if (mailbox == 'inbox')
            load_mailbox('inbox')
        else
            load_mailbox('archived')
    });
    
}

// #############################################################################

function reply_email (email) {
    document.querySelector('.replydisable').disabled = true;
    document.querySelector('.submitdisable').disabled = false;

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    document.querySelector('#compose-recipients').value = email.sender;

    checkError();
    checkMessage();

    if (email.subject.slice(0,4) == 'Re: ') 
        document.querySelector('#compose-subject').value = email.subject;
    else 
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
    
    document.querySelector('#compose-body').value = `\n--------------------------------\n 
    On ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}

// #############################################################################

function readStatus(status, idOfEmail) {
    if (status == false) {
        const data = {
            read: true
        };
        fetch('/emails/'+ idOfEmail, {
            method: 'PUT',
            body: JSON.stringify(data)
            });
    }
}

// #############################################################################
// technical functions
// -----------------------------------------------------------------------

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

// remove old element
function removeOld(element){
    const old = document.querySelector(element);
    if (old)
        old.remove();
}

// #############################################################################

// for display the message or error once
function checkError() {
    const elem = document.querySelector('#errspan');
    if (elem) {
        if (errorswitch == false) {
            errorswitch = true;
        }
        else {
            errorswitch = false;
            elem.remove();
        } 
    }
}

function checkMessage() {
    const melem = document.querySelector('#messpan');
    if (melem) {
        if (messageswitch == false) {
            messageswitch = true;
        }
        else {
            messageswitch = false;
            melem.remove();
        }
    } 
}

// #############################################################################


