CREATE TABLE seat_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  guest_name VARCHAR(80) NOT NULL,
  party_size INT NOT NULL,
  requested_for DATETIME(6) NOT NULL,
  status VARCHAR(20) NOT NULL,
  table_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_seat_requests_table (table_id),
  CONSTRAINT fk_seat_requests_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id)
) ENGINE=InnoDB;
