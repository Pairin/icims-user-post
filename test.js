const lambda  = require('./handler').run
const event = {
  Records: [
    { EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn: 'arn:aws:sns:us-east-1:370006364474:staging-icims-user-post:64990d87-e401-4101-87cf-c74f5c5bffbd',
      Sns:
        { Type: 'Notification',
        MessageId: '27f2fa57-c675-5399-a06c-af89963573ff',
        TopicArn: 'arn:aws:sns:us-east-1:370006364474:staging-icims-user-post',
        Subject: null,
        Message: '{"assessment_id":"92570"}',
        Timestamp: '2019-08-26T21:24:16.032Z',
        SignatureVersion: '1',
        Signature: 'HbcOgD9kYwesgRmLxRRFzn2yf3e3Hpg4jjTzthu7X6BWa/qKOhfIwFGeju8KkyW15rPOyF8PdI74cFpcMz7mmaRFWRvhNDETrhi/p1+yuN4DTrZmMooxrgZHl1P+8gOhDc8exK2I/fxLCdjJNEwh1BxvPZa9cHnm3LnLROdsTcTRu0CIINJ3LC5CBr800g6PWo4GXV+nqCI+fNImLUkJt78loN0K+cR2zerLEd2o6fxkiwJtsaofuiSMFszQgjroiIkZbLtfwHiETmA0hMQjh0qrfuQTfXc96ead0Xl3SUyiLRz6PgU7yvN8Fq1Rl3woti+T8tGMeV7A+kTYaXDxGA==',
        SigningCertUrl: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem',
        UnsubscribeUrl: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:370006364474:staging-icims-user-post:64990d87-e401-4101-87cf-c74f5c5bffbd',
        MessageAttributes: {}
      }
    }
  ]
}
lambda(event)
