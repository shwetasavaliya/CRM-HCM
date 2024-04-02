const sqlQry = `
CREATE TABLE IF NOT EXISTS customer_master (
    customer_id SERIAL PRIMARY KEY,
    customer_uuid UUID,
    _company_id UUID,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    mobile_number VARCHAR(20),
    user_name VARCHAR (100),
    email_id VARCHAR (50),
    password VARCHAR (100),
    gender VARCHAR (10),
    user_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    date_of_birth VARCHAR (25),
    is_first_login BOOLEAN DEFAULT false,
    is_married BOOLEAN,
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS documents_master (
    documents_id SERIAL PRIMARY KEY,
    _customer_id UUID,
    aadhar_number VARCHAR (20),
    aadhar_front_url TEXT,
    aadhar_back_url TEXT,
    pancard_number VARCHAR (20),
    pancard_url TEXT,
    passport_number VARCHAR (20),
    passport_url TEXT,
    passport_expiry_date VARCHAR (25),
    voting_url TEXT,
    birth_certificate_url TEXT,
    leaving_certificate_url TEXT,
    caste_certificate_url TEXT,
    driving_number VARCHAR (20),
    driving_url TEXT,
    light_bill_urls  JSONB DEFAULT '[]',
    itr_file_number INT,
    itr   _file_name VARCHAR (100),
    bank_detail_urls JSONB DEFAULT '[]',
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
);


  CREATE TABLE IF NOT EXISTS employee_master (
    employee_id UUID PRIMARY KEY,
    company_id UUID,
    company_name VARCHAR(255),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    mobile_number VARCHAR(20),
    user_name VARCHAR (100),
    email_id VARCHAR (50),
    password VARCHAR (100),
    gender VARCHAR (10),
    role VARCHAR (20),
    is_active BOOLEAN DEFAULT true,
    is_first_login BOOLEAN DEFAULT false,
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS communication_master (
    communication_id SERIAL PRIMARY KEY,
    _employee_id UUID,
    _customer_id UUID,
    type VARCHAR(20),
    description TEXT,
    reminder VARCHAR(30),
    status VARCHAR(30),
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );


  CREATE TABLE IF NOT EXISTS conversations_master (
    conversation_id SERIAL PRIMARY KEY,
    _employee_id UUID,
    _customer_id UUID,
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages_master (
    message_id SERIAL PRIMARY KEY,
    _conversation_id INT,
    _sender_id UUID,
    _receiver_id UUID,
    message TEXT,
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );
  

  CREATE TABLE IF NOT EXISTS itr_master (
    itr_id SERIAL PRIMARY KEY,
    _customer_id UUID,
    year VARCHAR(20),
    itr_url JSON DEFAULT '[]',
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS link_token_master (
    link_token_id UUID PRIMARY KEY,
    _employee_id UUID
    _customer_id UUID,
    date_created VARCHAR (25),
    date_modified VARCHAR (25),
    is_deleted INT DEFAULT 0
  );

`;
