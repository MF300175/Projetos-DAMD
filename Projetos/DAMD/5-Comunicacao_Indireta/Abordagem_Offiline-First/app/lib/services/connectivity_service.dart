import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

enum ConnectivityStatus {
  online,
  offline,
  onlineWithPending,
}

class ConnectivityService {
  static final ConnectivityService instance = ConnectivityService._init();
  ConnectivityService._init();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  
  ConnectivityStatus _currentStatus = ConnectivityStatus.offline;
  final _statusController = StreamController<ConnectivityStatus>.broadcast();
  
  Stream<ConnectivityStatus> get statusStream => _statusController.stream;
  
  ConnectivityStatus get currentStatus => _currentStatus;

  Future<void> initialize() async {
    await checkConnectivity();
    _startListening();
  }

  Future<void> checkConnectivity() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _updateStatus(results);
    } catch (e) {
      print('Erro ao verificar conectividade: $e');
      _setStatus(ConnectivityStatus.offline);
    }
  }

  void _startListening() {
    _subscription?.cancel();
    _subscription = _connectivity.onConnectivityChanged.listen(
      (List<ConnectivityResult> results) {
        _updateStatus(results);
      },
      onError: (error) {
        print('Erro no listener de conectividade: $error');
        _setStatus(ConnectivityStatus.offline);
      },
    );
  }

  void _updateStatus(List<ConnectivityResult> results) {
    final isOnline = results.any((result) => result != ConnectivityResult.none);
    if (isOnline) {
      if (_currentStatus == ConnectivityStatus.offline) {
        _setStatus(ConnectivityStatus.online);
      }
    } else {
      if (_currentStatus != ConnectivityStatus.offline) {
        _setStatus(ConnectivityStatus.offline);
      }
    }
  }

  void _setStatus(ConnectivityStatus status) {
    if (_currentStatus != status) {
      _currentStatus = status;
      _statusController.add(status);
    }
  }

  void updateStatusWithPending(bool hasPending) {
    if (_currentStatus == ConnectivityStatus.offline) {
      return;
    }
    
    if (hasPending) {
      if (_currentStatus == ConnectivityStatus.online) {
        _setStatus(ConnectivityStatus.onlineWithPending);
      }
    } else {
      if (_currentStatus == ConnectivityStatus.onlineWithPending) {
        _setStatus(ConnectivityStatus.online);
      }
    }
  }

  void forceOffline() {
    if (_currentStatus != ConnectivityStatus.offline) {
      _setStatus(ConnectivityStatus.offline);
    }
  }

  bool get isOnline => 
      _currentStatus == ConnectivityStatus.online || 
      _currentStatus == ConnectivityStatus.onlineWithPending;

  bool get isOffline => _currentStatus == ConnectivityStatus.offline;

  bool get hasPendingSync => _currentStatus == ConnectivityStatus.onlineWithPending;

  void dispose() {
    _subscription?.cancel();
    _statusController.close();
  }
}

