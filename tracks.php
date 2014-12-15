<?php

if($_POST['action'] == 'add') {
    
    $errors = array();
    $data = array();
    
    if(empty($_POST['track'])) {
        $errors['track'] = 'No trackID submitted';
    }
    
    if(!empty($errors)) {
        $data['success'] = false;
        $data['errors'] = $errors;
    } else {
        $data['success'] = true;
    	$data['message'] = 'Nothing here yet';
        $data['added'] = $_POST['track'];
    }
    
    echo json_encode($data);
    
}
?>