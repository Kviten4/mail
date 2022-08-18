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
    let elem = '#errspan';
    errorswitch = errAndMesCheck(elem, errorswitch);
}

// #############################################################################

async function sendmail() {

    const data = {
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
        }
    
    await fetch('/emails', {
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
            const errspan = document.createElement('span');
            errspan.innerHTML = `${result.error}`;
            errspan.setAttribute('id', 'errspan');
            document.querySelector('#error').append(errspan);
            compose_email();
        }
        else {
            const messpan = document.createElement('span');
            messpan.innerHTML = `${result.message}`;
            messpan.setAttribute('id', 'messpan');
            document.querySelector('#message').append(messpan);
            load_mailbox('sent');
        }
        });
    return false;   
}

// ############################################################################

async function load_mailbox(mailbox) {
    console.log('start load_mailbox')
    const oldgrid = document.querySelector('#mailGrid');
    // console.log(oldgrid)
        if (oldgrid)
        oldgrid.remove();
    const clear = document.querySelector('#mailGrid');
      
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
    // for display the message once
    const elem = '#messpan';
    messageswitch = errAndMesCheck(elem, messageswitch);
    
    await fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
        console.log('emails in fetch', emails)
        const maingrid = document.createElement('div');
        maingrid.setAttribute('id', 'mailGrid'); 
        emails.forEach(email => {
            
            const grid_line = document.createElement('div');
            const recipientSender_field = document.createElement('span');
            const subject_field = document.createElement('span');
            const timestamp_field = document.createElement('span');

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
            }
            subject_field.innerHTML = `${email.subject}`;
            timestamp_field.innerHTML = `${email.timestamp}`;

            timestamp_field.setAttribute('class', 'stamp');

            grid_line.append(recipientSender_field);
            grid_line.append(subject_field);
            grid_line.append(timestamp_field);
            const archivebutton = document.createElement('button');
            if (mailbox != 'sent') {
                if (mailbox == 'inbox')
                    archivebutton.innerText = 'Archive';
                else
                    archivebutton.innerText = 'Unzip';
                
                archivebutton.className = 'arcButton btn-primary';
                
                grid_line.append(archivebutton);
            }

            maingrid.append(grid_line);
            // console.log('Нічого немає!!!', email.archived);
            grid_line.addEventListener('click', (event) => load_email(event, email.id, email.archived, archivebutton));    

        });
        document.querySelector('#emails-view').append(maingrid);
        console.log('start append')
    });
}

// #############################################################################

async function load_email(event, idOfEmail, arcStatus, arcbutton) {
    console.log('start load_email')
    if (event.target === arcbutton)
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
        
        await fetch('/emails/' + idOfEmail)
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
            body_field.innerHTML = `${email.body}`;

            divForMail.setAttribute('id', 'divForMail');

            divForMail.append(sender_field);
            divForMail.append(recipients_field);
            divForMail.append(subject_field);
            divForMail.append(timestamp_field);
            divForMail.append(body_field);


            document.querySelector('#emails-view').append(divForMail);

            read(idOfEmail, email)
        })
    }
}

// #############################################################################

async function archive_email(idOfEmail, arcStatus) {
    console.log('start arhive_email')
    // console.log('arcStatus', arcStatus)
    let status = false;
    if (arcStatus == false)
        status = true;
    
    const data = {
        archived: (status)
    };

    await fetch('/emails/'+ idOfEmail, {
        method: 'PUT',
        body: JSON.stringify(data)
        });
    
    
    load_mailbox('inbox');
}

// #############################################################################
// technical functions
// -----------------------------------------------------------------------

// for display the message or error once
function errAndMesCheck (element, t) {
    const message = document.querySelector(element);
    if (message) {
        if (t == false) {
            t = true
        }
        else {
            t = false;
            document.getElementById(element.slice(1)).remove();
        }
    }
    return t;
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

async function read(idOfEmail, email){
    if (email.read == false) {
        const data = {
            read: true
        };
        await fetch('/emails/'+ idOfEmail, {
            method: 'PUT',
            body: JSON.stringify(data)
            });
    }
}
