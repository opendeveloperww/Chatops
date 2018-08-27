var express = require('express');
var bodyParser = require('body-parser');
const sn=require('servicenow-rest-api');
var crypto = require('crypto');
var mongo = require('mongodb');


var app = express();
var new_db = "mongodb://admin:admin123@ds119072.mlab.com:19072/nodetest";

var port = process.env.PORT || 1338;

// create application/x-www-form-urlencoded parser
app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',function(req,res){
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/login.html');
});

var getHash = ( pass , phone ) => {
				
  var hmac = crypto.createHmac('sha512', phone);
  
  //passing the data to be hashed
  data = hmac.update(pass);
  //Creating the hmac in the required format
  gen_hmac= data.digest('hex');
  //Printing the output on the console
  console.log("hmac : " + gen_hmac);
  return gen_hmac;
}

app.post('/login_form' ,function(req,res){
	var email= req.body.email;
	var pass = req.body.password;	
    var password = getHash( pass , email ); 	
	
	mongo.connect(new_db , function(error , db){
		if (error){
			throw error;
		}
		console.log("connected to database successfully!!");
		//Fetch A COLLECTION IN MONGODB USING NODE.JS
		var query = { email: email, password: password, failcount:0 };
		db.collection('user').find(query).toArray(function(err, collection){
			if(err) throw err;
			
			if(collection.length == 1)
			{
				console.log("logged in successfully");
					console.log("id : " + collection[0]._id)
					var myquery = {  _id: collection[0]._id };
					var newvalues = { $set: {failcount: 0 } };
					db.collection("user").update(myquery, newvalues, function(err, res) {
					if (err) throw err;
					console.log(" failcount updated");
					db.close();
					});
					
					res.json({success : "logged in Successfully", IsError : 'false'}); 
			}
			else
			{
				console.log("logged in failed");
				var query1 = { email: email };
				db.collection('user').find(query1).toArray(function(err, collection1){
			    if(err) throw err;
			
				if(collection1.length == 1)
				{
					console.log("id : " + collection1[0]._id)
					var myquery = { _id: collection1[0]._id };
					var count = collection1[0].failcount;
					var newvalues = { $set: {failcount: (count + 1) } };
					db.collection("user").update(myquery, newvalues, function(err, res) {
					if (err) throw err;
					console.log(" failcount updated");
					db.close();
					});
				}
				});
					
				res.json({success : "logged in failed", IsError : 'true'}); 
			}
		});
	});
});

app.post('/reset_pwd' ,function(req,res){
	
	var email= req.body.email;			
	
	mongo.connect(new_db , function(error , db){
		if (error){
			throw error;
		}
		
		var query = { email: email };
		db.collection('user').find(query).toArray(function(err, collection){
			if(err) throw err;
			
			if(collection.length == 1)
			{
					var myquery = {  _id: collection[0]._id };
					var newvalues = { $set: {failcount: 0 } };
					db.collection("user").update(myquery, newvalues, function(err, res) {
					if (err) throw err;
					console.log(" reset successfully");
					db.close();
					});
					
					res.json({success : "reset Successfully", IsError : 'false'}); 
			}
		});
	});
});

app.post('/sign_up' ,function(req,res){
	var name = req.body.name;
	var email= req.body.email;
	var pass = req.body.password;
	var phone =req.body.phone;
	var password = getHash( pass , email ); 				


	var data = {
		"name":name,
		"email":email,
		"password": password, 
		"phone" : phone,
		"failcount" : 0
	}
	
	mongo.connect(new_db , function(error , db){
		if (error){
			throw error;
		}
		console.log("connected to database successfully");
		//CREATING A COLLECTION IN MONGODB USING NODE.JS
		db.collection("user").insertOne(data, (err , collection) => {
			if(err) throw err;
			console.log("Record inserted successfully");
			console.log(collection);
		});
	});
	
	console.log("DATA is " + JSON.stringify(data) );
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/success.html');  

});

app.get("/ticket",function(request,response)  
{  
    //response.json({"Message":"Welcome to Node js"});     
    const ServiceNow=new sn('dev53609','admin','ziR5IegsX0PO');

    console.log("Start");
    //ServiceNow.Authenticate();

    ServiceNow.Authenticate(res=>{
      console.log(res.status);
  });

    //ServiceNow.getSampleData('change_request',(res)=>{    // 
    //    console.log(res);
  
    const fields=[
      'number',
      'short_description',
      'assignment_group',
      'priority'
  ];
  
  const filters=[
      'number=INC0010004'
  ];

    ServiceNow.getTableData(fields,filters,'incident',res=>{
      console.log(res);
    }); 

});  

app.post("/SearchTicket",function(request,response)  
{  
    //response.json({"Message":"Welcome to Node js"});     
    const ServiceNow=new sn('dev53609','admin','ziR5IegsX0PO');

    console.log("Start");
    //ServiceNow.Authenticate();

    ServiceNow.Authenticate(res=>{
      console.log(res.status);
  });
  
    const fields=[
      'number',
      'short_description',
      'assignment_group',
      'priority',
      'incident_state'
  ];

  console.log(request.body.queryResult.parameters.ticketNo)
  
  const filters=[
      'number=' + request.body.queryResult.parameters.ticketNo
  ];

      ServiceNow.getTableData(fields,filters,'incident',res=>{
      console.log(res[0].number + ": " + res[0].short_description);
      console.log(res);

      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify({
        "fulfillmentText": "Ticket Details are-- Ticket Number:" + res[0].number + " | Description :" + res[0].short_description + " | State : " + 
        res[0].incident_state
      }
      ));

    }); 
    
});  

app.post("/CreateTicket",function(request,response)  
{  
    //response.json({"Message":"Welcome to Node js"});     
    const ServiceNow=new sn('dev53609','admin','ziR5IegsX0PO');

    console.log("Start");
    //ServiceNow.Authenticate();

    ServiceNow.Authenticate(res=>{
      console.log(res.status);
  });
    
  console.log(request.body.queryResult.parameters.short_description);

  const data={
    'short_description': request.body.queryResult.parameters.short_description ,
    'urgency'  : request.body.queryResult.parameters.urgency ,
    'priority' : request.body.queryResult.parameters.priority
};

  ServiceNow.createNewTask(data,'incident',res=>{
    console.log(res);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
      "fulfillmentText": " Ticket " + res.number + " Created Successfully " 
    }
    ));
  });

});

app.post("/UpdateTicket",function(request,response)  
{  
    //response.json({"Message":"Welcome to Node js"});     
    const ServiceNow=new sn('dev53609','admin','ziR5IegsX0PO');

    console.log("Start");
    //ServiceNow.Authenticate();

    ServiceNow.Authenticate(res=>{
      console.log(res.status);
  });
    
  console.log(request.body.queryResult.parameters.state);

  const data={
    'incident_state':request.body.queryResult.parameters.state
  };

  ServiceNow.UpdateTask('incident',request.body.queryResult.parameters.ticketNo ,data,res=>{
      console.log(res);
      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify({
        "fulfillmentText": " Ticket " + res.number + " Updated Successfully " 
      }
      ));
  });

});

app.post("/postTicket",function(request,response)  
{
  response.setHeader('Content-Type', 'application/json');
  response.send(JSON.stringify({
    "fulfillmentText": "Hello : You have order pizza with toppings " +  request.body.queryResult.parameters.toppings[0] + " and " + request.body.queryResult.parameters.toppings[1] +
     " with cheese " + request.body.queryResult.parameters.cheese + ""
  }
    ));
});
 
app.post("/ServiceNow",function(request,response)  
{
  const ServiceNow=new sn('dev53609','admin','ziR5IegsX0PO');
  var snres;
    console.log("Start");
    //ServiceNow.Authenticate();

    ServiceNow.Authenticate(res=>{
      console.log(res.status);
  });
  response.setHeader('Content-Type', 'application/json');
  
  console.log(request.body.queryResult.intent.displayName)
  switch(request.body.queryResult.intent.displayName){
    case "servicenowgetdetails" :
      const fields=[
        'number',
        'short_description',
        'assignment_group',
        'priority',
        'incident_state'
    ];    
      console.log(request.body.queryResult.parameters.ticketNo)
    
      const filters=[
        'number=' + request.body.queryResult.parameters.ticketNo
      ];
    
      ServiceNow.getTableData(fields,filters,'incident',res=>{
        console.log(res[0].number + ": " + res[0].short_description);
        console.log(res);
        response.send(JSON.stringify({
            "fulfillmentText": "Ticket Details are-- Ticket Number:" + res[0].number + " | Description :" + res[0].short_description + " | State : " + 
            res[0].incident_state
          })
        );        
      });            
      break;  
      case "updateservicenowticket" :
        console.log(request.body.queryResult.parameters.state);

        const data={
          'incident_state':request.body.queryResult.parameters.state
        };
      
        ServiceNow.UpdateTask('incident',request.body.queryResult.parameters.ticketNo ,data,res=>{
            console.log(res);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
              "fulfillmentText": " Ticket " + res.number + " Updated Successfully " 
            }
            ));
        });
      break;
      case "createnewticket" :    
      console.log(request.body.queryResult.parameters.short_description);
        const insertdata={
          'short_description': request.body.queryResult.parameters.short_description ,
          'urgency'  : request.body.queryResult.parameters.urgency ,
          'priority' : request.body.queryResult.parameters.priority
      };
        ServiceNow.createNewTask(insertdata,'incident',res=>{
          console.log(res);
          response.setHeader('Content-Type', 'application/json');
          response.send(JSON.stringify({
            "fulfillmentText": " Ticket " + res.number + " Created Successfully " 
          }
          ));          
        });
      break;
      case "ticketstatus" :
        const fields=[
          'number',
          'short_description',
          'assignment_group',
          'priority',
          'incident_state'
      ];    
        console.log(request.body.queryResult.parameters.ticketNo)
      
        const filtersstatus=[
          'number=' + request.body.queryResult.parameters.ticketNo
        ];
      
        ServiceNow.getTableData(fields,filtersstatus,'incident',res=>{
          console.log(res[0].number + ": " + res[0].short_description);
          console.log(res);
          response.send(JSON.stringify({
              "fulfillmentText": "The state of Ticket Number: " + request.body.queryResult.parameters.ticketNo + " is " + res[0].incident_state
            })
          );        
        });
      break;
      case "resetpassword" :   
        //var email= req.body.email;			
        console.log(request.body.queryResult.parameters.email);
        var email = request.body.queryResult.parameters.email;  
        mongo.connect(new_db , function(error , db){
          if (error){
            throw error;
          }
          
          var query = { email: email };
          db.collection('user').find(query).toArray(function(err, collection){
            if(err) throw err;
            
            if(collection.length == 1)
            {
                var myquery = {  _id: collection[0]._id };
                var newvalues = { $set: {failcount: 0 } };
                db.collection("user").update(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log(" reset successfully");
                db.close();
                });
                
                //res.json({success : "reset Successfully", IsError : 'false'}); 
                response.send(JSON.stringify({
                  "fulfillmentText": "Password has been reset successfully" 
                }
                ));
            }
          });
        });
      break;  
      case "signup" :
        var name = request.body.queryResult.parameters.name;
        var email= request.body.queryResult.parameters.email;
        var pass = "test123";
        var phone = request.body.queryResult.parameters.phone;
        var password = getHash( pass , email ); 				
              
        var signUpData = {
          "name":name,
          "email":email,
          "password": password, 
          "phone" : phone,
          "failcount" : 0
        }
        
        mongo.connect(new_db , function(error , db){
          if (error){
            throw error;
          }
          console.log("connected to database successfully");
          //CREATING A COLLECTION IN MONGODB USING NODE.JS
          db.collection("user").insertOne(signUpData, (err , collection) => {
            if(err) throw err;
            console.log("Record inserted successfully");
            console.log(collection);
          });
        });
        
        console.log("DATA is " + JSON.stringify(signUpData) );
        response.send(JSON.stringify({
          "fulfillmentText": "You have been registered successfully. Password will be emailed to you" 
        }
        ));
        /*
        res.set({
          'Access-Control-Allow-Origin' : '*'
        });
        return res.redirect('/public/success.html'); 
        */
      }
});


var server=app.listen(process.env.PORT || 1338,function() {
  console.log("Server listening")
}); 