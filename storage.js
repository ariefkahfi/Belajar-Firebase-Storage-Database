var config = {
      apiKey: "apiKey",
      authDomain: "projectId.firebaseapp.com",
      databaseURL: "https://databaseName.firebaseio.com",
      storageBucket: "bucket.appspot.com"
};

  firebase.initializeApp(config);

  var fDatabase = firebase.database();
  var fStorage = firebase.storage();

  let status = document.getElementById('status');

  status.innerHTML = "No Upload yet !";

  function onFileChange(event){
    let file = event.target.files[0];
    let fileType = file.type;

    let validImage = fileType.search("image");

    if(validImage === 0){
      uploadFile(file);
    }else{
      alert("not an valid image");
    }
  }


  function readDataFromDatabase(){
    let cardContainer =  document.getElementById('card-container');

    fDatabase.ref("/posts").on("value",(dataSnapshot)=>{
        cardContainer.innerHTML = null ;

        dataSnapshot.forEach((childs)=>{
          let posts = {
              name : childs.key,
              url : childs.child("downloadUrl").val(),
              size : childs.child("size").val()
          };
          let card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
              <img src="${posts.url}" alt="no Image"/>
              <span class="metas">File Name : ${posts.name}</span>
              <span class="metas">File Size : ${posts.size}</span>
              <span class="pin-delete" onclick="deleteFile('${posts.name}')">X</span>
          `;

          cardContainer.append(card);
        });
    });
  }

  readDataFromDatabase();
  function deleteFile(fileName){
    let confirmation = window.confirm(`are you sure to delete this ${fileName} file ? `);
    if(confirmation){
      removeFromStorage(fileName);
    }else{
      console.log("cancel confirmation for delete file");
    }
  }

  function removeFromDatabase(data){
    fDatabase.ref(`/posts/${data}`).remove((err)=>{
      if(err){
        console.log(err);
      }else{
        console.log("delete data success from database");
      }
    });
  }
  function removeFromStorage(data){
    let lastDash = data.substr(data.lastIndexOf("-"),data.length);
    let beforeDash = data.substr(0,data.lastIndexOf("-"));
    let concatStr = beforeDash.concat(lastDash.replace("-","."));

    fStorage.ref(`/image/${concatStr}`).delete()
    .then(()=>{
      console.log('remove data from storage');
      removeFromDatabase(data);
    })
    .catch((err)=>{
      console.log(err);
    });
  }

  function pushToDatabase(data){
    var databaseRef = fDatabase.ref("/posts");

    databaseRef.child(data.fileName).set({
      size : data.fileSize,
      downloadUrl : data.downloadUrl
    },(err)=>{
      if(err){
        console.log(err);
      }else{
        console.log('write data to database success');
      }
    });
  }


  let pauseButton = document.getElementById('pause');
  let resumeButton = document.getElementById('resume');

  let buttonTask = null;

  resumeButton.disabled = true;
  pauseButton.disabled = true;

  function resumeUpload(){
    if(buttonTask !== null){
      buttonTask.resume();
    }
  }
  function pauseUpload(){
    if(buttonTask !== null){
      buttonTask.pause();
    }
  }

  function uploadFile(file){
    var storageRef = fStorage.ref("/image");



    var storageChild = storageRef.child(`/${file.name}`);

    var uploadTask = storageChild.put(file);

    buttonTask = uploadTask;

    uploadTask.on("state_changed",(next)=>{
      let progress = (next.bytesTransferred / next.totalBytes * 100);



      switch(next.state){
        case firebase.storage.TaskState.PAUSED :
          status.innerHTML = "upload is paused on " +progress.toFixed(4)+ " %";
          pauseButton.disabled = true;
          resumeButton.disabled = false;
          break;
        case firebase.storage.TaskState.RUNNING :
          status.innerHTML = "uploading on " +progress.toFixed(4)+ " %";
          resumeButton.disabled = true;
          pauseButton.disabled = false;
          break;
      }
      // console.log(progress);
    },(err)=>{
      console.log(err);
    },()=>{
      console.log('uploading complete');
      status.innerHTML = "Uploading complete for " + file.name;
      pauseButton.disabled = true;
      resumeButton.disabled = true;

      storageChild.getMetadata()
      .then((resolve)=>{
        return {
          downloadUrl : resolve.downloadURLs[0],
          fileName : resolve.name.replace(".","-"),
          fileSize : resolve.size
        }
      }).then((resultObj)=>{
        pushToDatabase(resultObj);
      }).catch((err)=>{
        console.log(err);
      });

    });
  }
